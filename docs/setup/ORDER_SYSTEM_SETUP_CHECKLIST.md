# FashionUp Order System - Setup Checklist

Complete these steps to activate the order system in your app.

---

## ✅ Step 1: Database Migration (CRITICAL)

- [ ] Open Supabase dashboard
- [ ] Go to SQL Editor
- [ ] Create new query
- [ ] Copy entire content from `supabase/migrations/20260512_create_order_system.sql`
- [ ] Click "Run" to execute migration
- [ ] Verify all tables created:
  - [ ] `orders` table exists
  - [ ] `order_items` table exists
  - [ ] `order_timeline` table exists
  - [ ] `user_addresses` table exists
- [ ] Verify enums created:
  - [ ] `order_status` enum
  - [ ] `payment_status` enum
  - [ ] `payment_method` enum

**Tip**: After running, go to Table Editor and click refresh to see new tables.

---

## ✅ Step 2: Update Routes (App.tsx)

**Location**: `src/App.tsx`

1. [ ] Add imports at the top:
```typescript
import { lazy } from "react";

const Checkout = lazy(() => import("./pages/Checkout"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
```

2. [ ] Add routes in your `<Routes>` component:
```typescript
<Route path="/checkout" element={<Checkout />} />
<Route path="/orders" element={<OrderHistory />} />
<Route path="/orders/:orderId" element={<OrderDetails />} />
```

3. [ ] Save file and verify no TypeScript errors

---

## ✅ Step 3: Update Navigation

### Shopping Bag Page
**Location**: `src/pages/ShoppingBag.tsx`

- [ ] Find the "Checkout" button
- [ ] Update click handler to:
```typescript
onClick={() => navigate("/checkout")}
```

### Bottom Navigation
**Location**: `src/components/BottomNavigation.tsx`

- [ ] Add link to orders:
```typescript
<Link to="/orders" className="flex flex-col items-center gap-1">
  <PackageIcon className="w-5 h-5" />
  <span className="text-xs">Orders</span>
</Link>
```

### Profile Page
**Location**: `src/pages/Profile.tsx` (if exists)

- [ ] Add link to order history
- [ ] Add link to saved addresses (optional)

---

## ✅ Step 4: Admin Dashboard Setup

**Location**: `src/pages/AdminDashboard.tsx`

1. [ ] Add import:
```typescript
import AdminOrderManagement from "@/components/admin/AdminOrderManagement";
```

2. [ ] Add component to admin dashboard:
```typescript
<div className="grid gap-6">
  <AdminOrderManagement />
</div>
```

3. [ ] Save and verify component renders

---

## ✅ Step 5: Verify All Files Created

Check these files exist:

**Services**
- [ ] `src/services/orders/orderService.ts` (exists)

**Hooks**
- [ ] `src/hooks/useOrders.ts` (exists)
- [ ] `src/hooks/useOrderDetails.ts` (exists)
- [ ] `src/hooks/useUserAddresses.ts` (exists)

**Pages**
- [ ] `src/pages/Checkout.tsx` (refactored)
- [ ] `src/pages/OrderHistory.tsx` (created)
- [ ] `src/pages/OrderDetails.tsx` (created)

**Components**
- [ ] `src/components/OrderStatusBadge.tsx` (created)
- [ ] `src/components/OrderTimeline.tsx` (created)
- [ ] `src/components/admin/AdminOrderManagement.tsx` (created)

**Migration**
- [ ] `supabase/migrations/20260512_create_order_system.sql` (created)

---

## ✅ Step 6: Test Authentication

- [ ] Log in as regular user
- [ ] Verify user ID shows in browser console: `console.log(user?.id)`
- [ ] Create admin test account
- [ ] Add admin email to `VITE_ADMIN_EMAILS` in `.env`
- [ ] Log in as admin
- [ ] Verify admin status in console

---

## ✅ Step 7: Test Checkout Flow

### As Regular User:
1. [ ] Go to Home page
2. [ ] Add item to cart
3. [ ] Click shopping bag
4. [ ] Click "Checkout" button
5. [ ] Should navigate to `/checkout`
6. [ ] See Step 1: Cart Review
   - [ ] Items display correctly
   - [ ] Subtotal calculates
   - [ ] Shipping shows (0 if ≥10,000 KES, else 500)
   - [ ] Total is correct
7. [ ] Click "Proceed to Delivery"
8. [ ] Should show Step 2: Address
   - [ ] Form fields appear (first name, last name, etc.)
   - [ ] Existing addresses show (if any)
   - [ ] Checkbox to save address works
9. [ ] Fill form and click "Select Payment Method"
10. [ ] Should show Step 3: Payment
    - [ ] Radio buttons for M-Pesa, Card, COD
    - [ ] Selecting each shows relevant fields
11. [ ] Select M-Pesa
    - [ ] Phone input appears
    - [ ] Can enter phone number
12. [ ] Click "Place Order"
    - [ ] Shows loading state
    - [ ] After 2 seconds shows confirmation
13. [ ] Should show Step 4: Confirmation
    - [ ] Green checkmark icon
    - [ ] Order number displays
    - [ ] Total shows correctly
    - [ ] "View My Orders" button works
    - [ ] "Continue Shopping" button works

---

## ✅ Step 8: Test Order History

1. [ ] Click "View My Orders" from confirmation
2. [ ] Should go to `/orders`
3. [ ] Should see order list
   - [ ] Order number, date, total display
   - [ ] Status badges show (pending, confirmed, etc.)
   - [ ] Payment status shows
4. [ ] Click on order
5. [ ] Should navigate to `/orders/{orderId}`
6. [ ] Should see full order details:
   - [ ] Order number and date
   - [ ] Items with images, sizes, colors, quantities
   - [ ] Shipping address
   - [ ] Total breakdown
   - [ ] Timeline (should show at least one entry)

---

## ✅ Step 9: Verify Inventory Deduction

1. [ ] Open Supabase → Table Editor
2. [ ] Go to `product_variants` table
3. [ ] Find variant used in test order
4. [ ] Check `stock_quantity` reduced by order quantity
5. [ ] Check `out_of_stock` is `true` if quantity now 0

---

## ✅ Step 10: Test Admin Features

1. [ ] Log in as admin user
2. [ ] Go to Admin Dashboard
3. [ ] Should see Order Management section
   - [ ] Stats boxes show (pending, processing, failed)
   - [ ] Order table appears
   - [ ] Can search by order number
   - [ ] Can filter by status
   - [ ] Can filter by payment status
4. [ ] Click on test order
5. [ ] Should see order details in modal
6. [ ] Select new status from dropdown
7. [ ] Click "Update Status"
8. [ ] Status should change
9. [ ] Close modal
10. [ ] Verify order in list shows new status

---

## ✅ Step 11: Test Address Saving

1. [ ] Go through checkout again
2. [ ] First time use new address, check "Save this address"
3. [ ] Complete order
4. [ ] Go checkout again with same product
5. [ ] On Step 2: Address
6. [ ] Should see previously saved address in dropdown
7. [ ] Select saved address
8. [ ] Form should auto-fill
9. [ ] Can still proceed with same address

---

## ✅ Step 12: Test Payment Methods

1. [ ] Test M-Pesa method:
   - [ ] Enter phone number
   - [ ] Place order
   - [ ] Should succeed (90% chance)

2. [ ] Test Card method:
   - [ ] Should show card fields
   - [ ] Should accept card number
   - [ ] Should accept expiry and CVV
   - [ ] Should complete order

3. [ ] Test COD method:
   - [ ] No extra fields
   - [ ] Should complete order
   - [ ] Status shows COD

---

## ✅ Step 13: Security Check

1. [ ] Log in as User A
2. [ ] Place an order
3. [ ] Log out
4. [ ] Log in as User B
5. [ ] Go to `/orders`
6. [ ] Should NOT see User A's orders
7. [ ] Go directly to User A's order URL `/orders/{userAOrderId}`
8. [ ] Should NOT be able to view (404 or no access)
9. [ ] Log in as admin
10. [ ] Should see both User A and User B orders

---

## ✅ Step 14: Browser Console Check

1. [ ] Open Developer Tools (F12)
2. [ ] Go to Console tab
3. [ ] Complete checkout
4. [ ] Should see no errors (only warnings OK)
5. [ ] Check Network tab
6. [ ] All requests should be 200-201 (no 500 errors)

---

## ✅ Step 15: Mobile Responsive Check

1. [ ] Open checkout on mobile viewport
2. [ ] All inputs should be readable
3. [ ] Buttons clickable
4. [ ] Order history list scrollable
5. [ ] Order details all visible
6. [ ] No horizontal scrolling

---

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution**: Check all imports in new files, ensure paths are correct

### Issue: Database tables not appearing
**Solution**: 
- [ ] Check migration ran successfully
- [ ] Look for errors in Supabase SQL editor
- [ ] Click "Refresh" in Table Editor
- [ ] Check error logs in Supabase dashboard

### Issue: Routes not working
**Solution**:
- [ ] Verify routes added to `<Routes>` component
- [ ] Check component names match imports
- [ ] Verify lazy imports syntax
- [ ] Check browser console for routing errors

### Issue: Checkout doesn't create order
**Solution**:
- [ ] Check Supabase connection works
- [ ] Verify user is authenticated
- [ ] Check browser console for errors
- [ ] Look at Network tab - what's the error response?
- [ ] Verify orders table exists in Supabase

### Issue: Admin can't see orders
**Solution**:
- [ ] Check user email in `VITE_ADMIN_EMAILS`
- [ ] Verify admin role set in `user_roles` table
- [ ] Check RLS policy allows admin access
- [ ] Verify user_id is in auth.users table

### Issue: Inventory not reducing
**Solution**:
- [ ] Check variant_id on cart item is correct
- [ ] Verify `stock_quantity` column exists in `product_variants`
- [ ] Check order was created successfully
- [ ] Look at order_items to verify line items saved

---

## Success Criteria

You'll know it's working when:

✅ Database migration applied without errors  
✅ Routes show pages without 404s  
✅ Checkout creates orders in database  
✅ Order appears in user's order history  
✅ Admin can see and update orders  
✅ Inventory reduces after order  
✅ Users can't see other users' orders  
✅ Mobile layout works  
✅ No console errors  

---

## Production Deployment

Once all tests pass:

1. [ ] Run full test suite
2. [ ] Test on staging environment
3. [ ] Verify Supabase backups
4. [ ] Deploy to production
5. [ ] Monitor order creation logs
6. [ ] Verify payment simulations working
7. [ ] Test admin panel with live data

---

## Next Features (Optional)

After verification:
- [ ] Add email confirmations
- [ ] Implement real payment gateway
- [ ] Add order cancellation
- [ ] Add returns/exchanges
- [ ] Add analytics dashboard
- [ ] Add order search
- [ ] Add pagination to admin orders

---

**Timeline**: Should take 30-60 minutes to complete all checks.

**Support**: Refer to `ORDER_SYSTEM_GUIDE.md` for detailed documentation.

**Status**: When all steps checked, system is production-ready! 🚀
