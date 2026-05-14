# 🔧 CHECKOUT ERROR - QUICK FIX GUIDE

## Status
You're getting: **"Error: order_number is not defined at handlePaymentSubmit (Checkout.tsx:183:11)"**

## Changes Made
✅ **orderService.ts** - Added validation to check order object exists and has required fields  
✅ **Checkout.tsx** - Added better error checking and extraction of order data  

## What To Do Now

### Option 1: Use Fresh Clean Database Setup (Recommended)
If the incremental migration keeps failing:

1. **Open Supabase SQL Editor**
2. **Run:** `SUPABASE_CLEAN_SETUP.sql`
   - This completely drops and recreates all 4 tables
   - Includes all columns, indexes, RLS, functions, triggers
   - Clean slate approach
   - ⚠️ **WARNING:** This drops existing data - backup first if needed

### Option 2: Diagnose Current Database
To see what's actually in your database:

1. **Open Supabase SQL Editor**
2. **Run:** `SUPABASE_DIAGNOSTIC.sql`
3. **Review the results** - Compare with expected columns

## If You Keep Getting Database Errors

The issue is likely that the `orders` table is missing the `order_number` column (or other critical columns). 

When **createOrder** tries to do:
```typescript
.from("orders")
.insert({
  order_number,
  user_id: params.user_id,
  ...
})
```

If `order_number` column doesn't exist, Supabase will return an error.

## Testing the Fix

Once you've run the clean setup:

1. Clear your browser cache (DevTools → Application → Clear Storage)
2. Go to a product → Add to cart → Go to checkout
3. Fill form and try to place order
4. Check browser console for detailed error logs

## Expected Flow
1. ✅ Checkout form validation
2. ✅ Order created in database
3. ✅ Order items added
4. ✅ Inventory deducted
5. ✅ Payment simulated
6. ✅ Confirmation page shows order number

## Debug Tips

If you still get errors:

1. **Check browser console** - Look for detailed error messages
2. **Check Supabase logs** - Supabase UI → Logs
3. **Run diagnostic query** - See what columns exist
4. **Check RLS policies** - Policies might be blocking inserts

## Files Updated
- `src/services/orders/orderService.ts` - Better error handling
- `src/pages/Checkout.tsx` - Better validation
- `SUPABASE_CLEAN_SETUP.sql` - Clean database setup
- `SUPABASE_DIAGNOSTIC.sql` - Diagnostic queries
