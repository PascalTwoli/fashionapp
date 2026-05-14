# FashionUp Order System Implementation Guide

## Overview

This document outlines the complete, production-ready order system implementation for FashionUp. The system includes real order creation, inventory management, order tracking, payment simulation, and admin management capabilities.

---

## Part 1: Database Architecture

### Migrations Applied

All database changes are managed through a single migration file:
```
supabase/migrations/20260512_create_order_system.sql
```

This migration creates:
1. **Enums** - Order status, payment status, payment method
2. **Orders Table** - Main order records
3. **Order Items Table** - Individual items in each order
4. **Order Timeline Table** - Order status progression history
5. **User Addresses Table** - Saved shipping addresses for customers
6. **RLS Policies** - Row-level security for all tables
7. **Triggers & Functions** - Auto-update timestamps

### Key Database Features

- **Referential Integrity**: Foreign keys with CASCADE delete
- **Timestamps**: Auto-updated `updated_at` field on changes
- **Audit Trail**: Complete order timeline history
- **Data Snapshots**: Order items store product data at order time
- **Security**: RLS policies for data privacy
- **Indexes**: Optimized queries for common operations

---

## Part 2: File Structure

```
src/
├── services/
│   └── orders/
│       └── orderService.ts        # Core order logic
├── hooks/
│   ├── useOrders.ts              # Fetch user orders
│   ├── useOrderDetails.ts        # Get single order details
│   └── useUserAddresses.ts       # Manage saved addresses
├── pages/
│   ├── Checkout.tsx              # Complete checkout flow (REFACTORED)
│   ├── OrderHistory.tsx          # User's order list
│   └── OrderDetails.tsx          # Order detail view
├── components/
│   ├── OrderStatusBadge.tsx      # Status display component
│   ├── OrderTimeline.tsx         # Order history timeline
│   └── admin/
│       └── AdminOrderManagement.tsx  # Admin order dashboard
└── lib/
    └── format.ts                 # Utility functions (already exists)

supabase/
└── migrations/
    └── 20260512_create_order_system.sql
```

---

## Part 3: Core Services

### `orderService.ts`

Main service file with the following functions:

#### `generateOrderNumber()`
- Format: `FUP-YYYY-XXXXXX`
- Ensures uniqueness with database checks
- Automatically retries if collision occurs

#### `calculateShippingFee(subtotal)`
- Free shipping for orders >= 10,000 KES
- 500 KES for smaller orders
- Returns: numeric fee

#### `validateOrderInventory(items)`
- Checks availability before checkout
- Prevents overselling
- Returns: `{ valid: boolean, errors: string[] }`

#### `createOrder(params)`
- Creates order, items, timeline, and applies inventory changes
- Transactional-like behavior (rollback on failure)
- Returns: `{ success, order?, error?, details? }`

Parameters:
```typescript
{
  user_id: string;
  items: CartItem[];
  customer_email: string;
  customer_phone: string;
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_county: string;
  shipping_country: string;
  payment_method: "mpesa" | "card" | "cash_on_delivery";
  delivery_instructions?: string;
}
```

#### `deductOrderInventory(items, orderId)`
- Reduces product variant stock after order creation
- Marks variants as `out_of_stock` when zero
- Returns: `{ success, errors }`

#### `updateOrderStatus(orderId, newStatus, note?)`
- Updates order status
- Creates timeline entry
- Returns: `{ success, error? }`

#### `updatePaymentStatus(orderId, paymentStatus, reference?)`
- Updates payment status
- Changes order status to `confirmed` if payment succeeds
- Returns: `{ success, error? }`

#### `getUserOrders(userId)`
- Fetches all orders for a user
- Ordered by most recent first
- Returns: `{ data, error }`

#### `getOrderDetails(orderId)`
- Fetches full order with items and timeline
- Used for order detail page
- Returns: `{ data, error }`

---

## Part 4: Custom Hooks

### `useOrders()`
```typescript
const { data: orders, isLoading, error } = useOrders();
```
- Fetches user's order history
- Auto-updates when user changes
- Uses React Query caching

### `useOrderDetails(orderId)`
```typescript
const { data: order, isLoading, error } = useOrderDetails(orderId);
```
- Fetches single order with all details
- Enabled only when orderId is provided
- Refetch on demand

### `useUserAddresses()`
```typescript
const { data: addresses } = useUserAddresses();
```
- Fetches all saved addresses for user
- Ordered by default flag and creation date

### `useAddAddress()`
```typescript
const { mutate: addAddress } = useAddAddress();
addAddress({ first_name, last_name, phone, ... });
```
- Create new shipping address
- Auto-invalidates address query

### `useUpdateAddress()`
```typescript
const { mutate: updateAddress } = useUpdateAddress();
updateAddress({ id, first_name, ... });
```
- Update existing address

### `useDeleteAddress()`
```typescript
const { mutate: deleteAddress } = useDeleteAddress();
deleteAddress(addressId);
```
- Delete saved address

### `useSetDefaultAddress()`
```typescript
const { mutate: setDefault } = useSetDefaultAddress();
setDefault(addressId);
```
- Set address as default for future orders

### `useDefaultAddress()`
```typescript
const { data: defaultAddress } = useDefaultAddress();
```
- Get default address or null

---

## Part 5: Checkout Flow (Refactored)

The new checkout.tsx implements a 4-step process:

### Step 1: Cart Review
- Display all items
- Show subtotal, shipping, total
- Proceed to checkout button

### Step 2: Delivery Address
- Use existing saved addresses OR enter new
- Option to save new address
- Fields: first name, last name, email, phone, address, city, county, delivery instructions

### Step 3: Payment Method
- M-Pesa (with phone input)
- Card (sandbox, no real processing)
- Cash on Delivery

### Step 4: Confirmation
- Show success icon
- Display order number
- Show order total
- Links to view orders or continue shopping

### Key Features:
- Validates inventory before payment
- Deducts stock on successful order
- Simulated payment processing (2-second delay, 90% success rate)
- Saves address if requested
- Uses existing address if selected
- Real order created in database

---

## Part 6: Pages & Components

### `Checkout.tsx` (Refactored)
- Multi-step form with address, payment, confirmation
- Integrated with new order service
- Real order creation with inventory deduction
- Payment simulation

### `OrderHistory.tsx`
- List all user orders
- Shows order number, date, total, status
- Clickable to view order details
- Loading and empty states

### `OrderDetails.tsx`
- Complete order information
- Shipping address
- Ordered items with prices
- Payment information
- Order timeline with status progression
- Totals breakdown

### `OrderStatusBadge.tsx`
- Displays order status with color
- Pending (yellow), Confirmed (blue), Processing (purple), Shipped (cyan), Delivered (green), Cancelled (red)
- Payment status badges with same colors

### `OrderTimeline.tsx`
- Visual timeline of order status changes
- Shows timestamps for each status
- Icons for each status type
- Used on order detail page

### `AdminOrderManagement.tsx`
- View all orders (100 limit)
- Search by order number, email, customer name
- Filter by order status and payment status
- Quick stats: pending count, processing count, failed payments
- Update order status from modal
- Auto-creates timeline entries

---

## Part 7: Setup Instructions

### Step 1: Apply Database Migration

```bash
# Copy the migration file
cp supabase/migrations/20260512_create_order_system.sql supabase/

# Push to Supabase (or manually run in Supabase dashboard)
supabase db push
```

Or manually in Supabase dashboard:
1. Go to SQL Editor
2. Create new query
3. Copy content from `20260512_create_order_system.sql`
4. Run query

### Step 2: Update Routes

Add to `src/App.tsx`:

```typescript
import { lazy } from "react";

const Checkout = lazy(() => import("./pages/Checkout"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));

// Inside Routes:
<Route path="/checkout" element={<Checkout />} />
<Route path="/orders" element={<OrderHistory />} />
<Route path="/orders/:orderId" element={<OrderDetails />} />
```

### Step 3: Update Cart Links

In `ShoppingBag.tsx`:
```typescript
onClick={() => navigate("/checkout")}
```

In `BottomNavigation.tsx`:
```typescript
<Link to="/orders">My Orders</Link>
```

### Step 4: Add to Admin Dashboard

In `AdminDashboard.tsx`:
```typescript
import AdminOrderManagement from "@/components/admin/AdminOrderManagement";

// Inside dashboard:
<AdminOrderManagement />
```

---

## Part 8: Environment Variables

No new environment variables required. Uses existing:
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_ADMIN_EMAILS (for admin role check)
```

---

## Part 9: API Integrations

### Ready for Future Integration

The order system is architected to support real payment gateways:

**M-Pesa Integration:**
- Phone number already captured
- Payment reference field ready
- Timeline for payment tracking

**Card Payments:**
- Payment method enum ready for "card"
- Can integrate Stripe/Pesapal
- No card data stored in app (security best practice)

**Integration Steps:**
1. Replace `simulatePayment()` with actual API call
2. Capture payment reference from gateway
3. Call `updatePaymentStatus()` with reference
4. Order automatically moves to `confirmed` status

---

## Part 10: Inventory System

### Stock Management

Before Order:
```
product_variants.stock_quantity >= cart_item.quantity
```

After Order:
```
product_variants.stock_quantity -= order_item.quantity
product_variants.out_of_stock = (stock === 0)
```

### Out of Stock Handling

- Variants with stock = 0 marked `out_of_stock = true`
- Add to cart disabled for out-of-stock
- Cart validation removes unavailable items

---

## Part 11: RLS Security

### User Policies

- Users can view only their own orders
- Users can create orders for themselves
- Users manage their own saved addresses

### Admin Policies

- Admins view all orders
- Admins update any order status
- Admins create timeline entries

### Data Access

```typescript
// Users see this
SELECT * FROM orders WHERE user_id = current_user_id

// Admins see this
SELECT * FROM orders -- All orders
```

---

## Part 12: Order Status Flow

```
pending → confirmed → processing → shipped → delivered
                  ↓
                cancelled (any time)

Failed payment:
payment_status = 'failed'
Status remains 'pending'
User can retry
```

---

## Part 13: Testing Checklist

- [ ] Create test order with inventory validation
- [ ] Verify stock reduces after order
- [ ] Check order appears in order history
- [ ] Verify order details display correctly
- [ ] Test admin can update order status
- [ ] Check timeline updates on status change
- [ ] Test address saving/reuse
- [ ] Verify payment simulation works
- [ ] Test with M-Pesa, Card, COD methods
- [ ] Verify RLS policies work (users can't see other orders)

---

## Part 14: Known Limitations & Future Work

### Current Limitations:
1. Payment is simulated (90% success rate)
2. 100 order limit in admin view (add pagination later)
3. No email notifications yet
4. No order cancellation refund logic yet
5. No partial refunds

### Future Enhancements:
1. Real payment gateway integration
2. Email order confirmation
3. SMS status updates
4. Order cancellation & refunds
5. Inventory reservations (prevent overselling during checkout)
6. Order export/analytics
7. Customer support ticket system
8. Returns & exchanges
9. Subscription orders
10. Loyalty points system

---

## Part 15: Troubleshooting

### Orders not appearing:
- Check user_id matches in database
- Verify RLS policies are enabled
- Check auth.users table has the user

### Payment status not updating:
- Verify payment reference is unique
- Check updatePaymentStatus called with correct orderId
- Look at order_timeline for entries

### Stock not reducing:
- Verify variant_id on cart item
- Check product_variants table has quantity field
- Ensure variant exists before order creation

### Admin can't see orders:
- Verify user_roles.role = 'admin'
- Check admin email in VITE_ADMIN_EMAILS
- Ensure RLS policy allows admin access

---

## Part 16: Performance Optimization

Currently uses:
- Indexed queries on common fields (user_id, status, placed_at)
- Materialized query results
- React Query caching

For scaling:
- Add pagination to admin orders
- Implement order search index
- Cache frequently accessed orders
- Archive old orders to separate table

---

## Summary

The order system is:
✅ Production-ready for current features
✅ Scalable architecture for future growth
✅ Secure with RLS policies
✅ Well-organized with services/hooks/components
✅ Ready for real payment integration
✅ Comprehensive admin management
✅ User-friendly customer experience

All code follows TypeScript strict mode, uses proper error handling, and maintains the minimal luxury aesthetic of FashionUp.
