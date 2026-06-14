# FashionUp Admin - Order Management Quick Start Guide

## 🎯 Getting Started

After login as an admin, navigate to **Admin Dashboard** → **Order Management** tab.

---

## 📊 Dashboard Overview

### Top Section - Analytics Cards

The dashboard displays 6 key metrics:

- **Total Orders** - All orders placed
- **Pending Orders** - Awaiting action
- **Processing** - In preparation
- **Delivered** - Successfully completed
- **Total Revenue** - All time revenue
- **This Month** - Current month earnings

*These update automatically every 60 seconds.*

---

### Red Alert - Low Stock

If you see a red **"Low Stock Alert"** card at the top:
- Shows products with ≤5 units remaining
- Click product name to view in products section
- Consider ordering inventory

---

## 🔍 Finding Orders

### Method 1: Search

1. Click the search bar at top
2. Type:
   - Order number (e.g., `FUP-2026-244822`)
   - Customer email (e.g., `john@example.com`)
   - Phone number (e.g., `254722123456`)
   - Customer name (e.g., `John Doe`)
3. Results update automatically

**Example:**
```
Search: "john@example.com"
Result: Shows all orders by John
```

### Method 2: Filters

1. Use dropdown filters below search:
   - **Order Status** - pending, confirmed, processing, shipped, delivered, cancelled
   - **Payment Status** - pending, paid, failed, refunded
   - **Payment Method** - M-Pesa, Card, Cash on Delivery
   - **Sort By** - newest, oldest, high-value, low-value

2. Click **"Reset Filters"** to clear all filters

**Example Workflow:**
```
1. Filter Status = "pending"
2. Filter Payment = "unpaid"
3. View all pending, unpaid orders
4. Click Reset to start fresh
```

---

## 📋 Order Table

The main table shows all matching orders:

| Column | Shows |
|--------|-------|
| **Order** | Order number (FUP-XXXX-XXXXXX) |
| **Customer** | Name & email |
| **Items** | Number of products and total quantity |
| **Total** | Order amount in KES |
| **Payment** | Payment status badge |
| **Status** | Order status badge |
| **Date** | When order was placed |
| **►** | Click to open full details |

### Understanding Status Colors

- **Amber** - Pending action needed
- **Gray** - Neutral/confirmed
- **Blue** - Processing/active
- **Purple** - Shipped/in transit
- **Green** - Delivered/complete
- **Red** - Cancelled/issue

---

## 👁️ Viewing Order Details

### How to Open

Click **anywhere on an order row** - a detailed drawer opens on the right side.

### What You'll See

#### Section 1: Quick Status
- Current **Order Status** with dropdown to change
- Current **Payment Status** (paid, pending, failed, refunded)
- **Payment Method** (M-Pesa, Card, COD)
- Payment reference if available

**To Change Status:**
1. Click status dropdown
2. Select new status (only valid transitions shown)
3. Click "Update Status" button
4. Confirm in dialog box
5. Timeline entry created automatically

#### Section 2: Customer Information
- Customer name
- Email address
- Phone number
- Account creation date

#### Section 3: Shipping Address
- Full name
- Street address
- City & county
- Country
- Special delivery instructions (if provided)

#### Section 4: Order Items
For each product purchased:
- Product image (thumbnail)
- Product name
- Size & color (if applicable)
- Quantity ordered
- Unit price
- Line total

**Example:**
```
[Image] Blue Shirt (Size M, Color Blue)
        Quantity: 2 × KES 2,500 = KES 5,000
```

#### Section 5: Order Summary
- Subtotal (all items)
- Shipping fee
- **Total Amount** (bold, large)

#### Section 6: Order Timeline
Complete history of order status changes:
- Each status change shows
- When it happened
- Any notes added
- Who made the change (if logged)

**Example Timeline:**
```
Order Placed - May 12, 2026 • 2:45 PM
  Order placed

Confirmed - May 12, 2026 • 2:46 PM
  Payment confirmed via M-Pesa

Processing - May 12, 2026 • 3:00 PM
  Started packing order

Shipped - May 13, 2026 • 9:30 AM
  Handed to courier
```

#### Section 7: Admin Notes
Internal notes visible only to admin team.

**To Add a Note:**
1. Click text area under "Add Internal Note"
2. Type your note (e.g., "Delivery window 2-4 PM requested")
3. Click "Add Note" button
4. Note appears in list below

**To Edit a Note:**
1. Find note in list
2. Click the ✎ (edit) icon
3. Type new text
4. Click "Save"

**To Delete a Note:**
1. Find note in list
2. Click the 🗑️ (trash) icon
3. Note is removed

---

## ⚡ Common Actions

### Scenario 1: Customer Asks for Status Update

1. **Search** for customer's order number
2. **Open** order details
3. **View Timeline** section
4. Tell customer: "Your order was [last status] at [time]"

### Scenario 2: Process New Pending Order

1. **Filter** Status = "pending"
2. **Select** the order
3. Verify customer email and address
4. **Change Status** to "confirmed"
5. **Add Note**: "Confirmed, ready to pack"
6. Close drawer

### Scenario 3: Mark Order as Shipped

1. **Search** for order number
2. **Open** order
3. **Change Status** to "shipped"
4. **Add Note**: "Shipped via DHL, tracking: XXXX"
5. Share tracking with customer
6. Close

### Scenario 4: Handle Payment Issue

1. **Search** for order
2. **Open** order
3. Check **Payment Status**
4. If "failed" or "pending":
   - **Change Status** to appropriate (ask for payment)
   - **Add Note**: "Payment pending - customer contacted"
5. **Update Payment** when received
6. **Confirm** order if payment received

### Scenario 5: Cancel Order

1. **Search** for order
2. **Open** order
3. Check status - can only cancel if not delivered
4. **Change Status** to "cancelled"
5. **Add Note**: "Cancelled - reason: [reason]"
6. Contact customer with refund info
7. Close

---

## 📱 Mobile Usage

The dashboard works on mobile/tablet:

- **Table scrolls horizontally** - swipe left/right
- **Drawer goes full screen** - swipe back to close
- **All buttons remain accessible**
- **Filters stack vertically**
- **Touch-friendly button sizes**

**Pro Tip:** Use mobile to quickly check order status on the go.

---

## 💡 Pro Tips

### Tip 1: Filter Combinations
Combine multiple filters for powerful searches:
```
Status: pending + Payment: unpaid = Orders waiting for payment
Status: processing + Sort: newest = Newest orders being packaged
```

### Tip 2: Bulk Status Updates
Don't need to open drawer for status info - view directly in table.

### Tip 3: Note Organization
Use consistent note format:
```
✅ Example: "PAID: M-Pesa ref #123456 confirmed"
✅ Example: "SHIPPED: Juno Logistics #ABC789"
✅ Example: "ISSUE: Address unclear - customer contacted"
```

### Tip 4: Quick Search
Search by payment reference to find specific transactions:
```
Search: "MP210512ABC123" → Finds M-Pesa order
```

### Tip 5: Low Stock Check
If low stock alert appears, note which products need reordering.

---

## ⚠️ Important Rules

❌ **Can't do:**
- Change delivered orders to earlier status
- Update cancelled orders
- Modify order items after placing
- Change customer address after shipping

✅ **Can do:**
- Add unlimited notes
- Change status (following workflow)
- Update payment status
- View all customer orders
- Filter by any criteria
- Export order data (coming soon)

---

## 🆘 Getting Help

### Order won't change status?
- Check current status in dropdown
- Dropdown only shows valid next statuses
- Can't skip steps (e.g., pending→delivered)
- Can't reverse shipped→processing

### Can't see some orders?
- Check filters aren't hiding them
- Search for specific order number
- Reset filters to "all"
- Verify order belongs to this account

### Payment status shows wrong?
- Manually update if necessary
- Add note explaining discrepancy
- System updates after customer payment

### Note won't save?
- Check text isn't empty
- Verify you're still connected
- Try again (network timeout)
- Contact IT if persists

---

## 📞 Contact Information

For technical issues:
- Email: admin@fashionup.com
- Slack: #admin-support
- Status page: admin.fashionup.com/status

---

## 🎓 Keyboard Shortcuts (Coming Soon)

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `n` | New order search |
| `?` | Show all shortcuts |

*Currently available in next version*

---

**Last Updated:** May 14, 2026  
**Version:** 1.0.0

Happy order managing! 🚀
