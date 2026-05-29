# Admin-Controlled Payment Methods

## Overview

Payment methods available to customers should be configurable by admin users through the Admin Settings page. This document captures the design intent and what needs to be built when the Admin Settings feature supports it.

## Current State (as of 2026-05-29)

- **Supported types**: `mpesa`, `card`
- **User-facing**: Customers can save M-Pesa numbers and card references (last 4 digits + expiry) in their profile under `/payment-methods`
- **Checkout**: The payment step shows all method types currently hardcoded — `mpesa`, `card`, and a placeholder `pay_on_delivery`
- **Admin control**: Not yet implemented — all methods are always visible

## Intended Behaviour

When admin settings support payment method configuration, the following flow should apply:

### Admin Side (to be built in `/admin/settings`)

1. Admin sees a list of available payment method types with enable/disable toggles:
   - M-Pesa (mobile money)
   - Card (Visa / Mastercard)
   - PayPal
   - Pay on Delivery
   - _others as added_

2. Enabled methods are stored in the `admin_settings` table, e.g.:
   ```json
   { "key": "enabled_payment_methods", "value": ["mpesa", "card"] }
   ```

### Customer Side (already partially built)

1. **`/payment-methods` page** (`src/pages/PaymentMethods.tsx`): The type selector (M-Pesa / Card) should query the admin settings and only show enabled types. Currently it shows both unconditionally.

   **Code change needed**: Replace the hardcoded `['mpesa', 'card']` array in the type selector with a query to `admin_settings` for `enabled_payment_methods`.

2. **Checkout payment step** (`src/pages/Checkout.tsx`): The three payment option radio buttons (`mpesa`, `card`, `pay_on_delivery`) should be filtered to only show admin-enabled methods.

   **Code change needed**: Fetch `enabled_payment_methods` from `admin_settings` and conditionally render payment options.

## Database

### `saved_payment_methods` table
See migration: `supabase/migrations/20260529_create_saved_payment_methods.sql`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK to auth.users |
| type | TEXT | `'mpesa'` or `'card'` |
| label | TEXT | User-defined name |
| phone | TEXT | M-Pesa only |
| card_last4 | TEXT | Card only — last 4 digits |
| card_holder | TEXT | Card only — name on card |
| card_expiry | TEXT | Card only — MM/YY |
| is_default | BOOLEAN | One default per user (unique index) |

### `admin_settings` table (existing)
When adding payment method control, insert:
```sql
INSERT INTO admin_settings (key, value, description)
VALUES (
  'enabled_payment_methods',
  '["mpesa", "card"]',
  'Payment methods available to customers at checkout and in payment method management'
);
```

## Hook to create when admin settings supports this

```typescript
// src/hooks/useEnabledPaymentMethods.ts
export const useEnabledPaymentMethods = () => {
  return useQuery({
    queryKey: ['admin-settings', 'enabled_payment_methods'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'enabled_payment_methods')
        .single();
      return (data?.value as string[]) ?? ['mpesa', 'card'];
    },
  });
};
```

Then in `PaymentMethods.tsx`, replace:
```tsx
{(['mpesa', 'card'] as MethodType[]).map(t => (...))}
```
with:
```tsx
{(enabledMethods as MethodType[]).map(t => (...))}
```
