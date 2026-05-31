# Payment Integration — Current Status & Roadmap

> Last updated: 2026-05-30
> App: FashionUp (fashionapp)

---

## TL;DR

Payment is **fully simulated** right now. No real money moves. The database schema and checkout UI are ready, but zero gateway integration exists. This document explains the current state and the exact steps needed to go live.

---

## Current State

### What IS already done

- Database schema ready: `orders.payment_status`, `orders.payment_reference`, `orders.payment_method` columns exist
- M-Pesa phone number collected in checkout UI
- Card fields collected in checkout UI
- Saved payment methods page (stores phone / card-last-4 for UX convenience)
- Order creation flow works correctly and deducts inventory

### What is NOT done (the actual payment)

- `simulatePayment()` in `src/pages/Checkout.tsx` is a **fake timer** — it waits 2–3 seconds and succeeds 90% of the time at random. No gateway is ever called.
- No payment SDK installed (`package.json` has zero payment dependencies)
- No API keys exist anywhere in `.env.local`
- `payment_status` is always left as `'pending'` — never updated to `'paid'`
- Card numbers are collected raw client-side — this is a **PCI DSS violation** that must be fixed before going live

---

## Recommended Stack for Kenya

Since this is M-Pesa first, three realistic options:

| Option | M-Pesa | Cards | Complexity | Kenya-ready |
|--------|--------|-------|-----------|-------------|
| **Intasend** | ✅ STK Push | ✅ Visa/MC | Low | ✅ Kenyan company |
| **Daraja (Safaricom)** | ✅ STK Push | ❌ | Medium | ✅ Direct |
| Daraja + Stripe | ✅ | ✅ | High | ⚠️ Stripe requires more compliance |

**Recommendation: Start with Intasend.**

It handles both M-Pesa and cards in one integration, is designed for Kenyan businesses, has a sandbox environment, and has a JavaScript SDK. It is the fastest path to live payments.

---

## Exact Steps to Go Live

### Step 1 — Get credentials (business task)

1. Create an account at [intasend.com](https://intasend.com) (sandbox is free)
2. Obtain:
   - `INTASEND_PUBLISHABLE_KEY`
   - `INTASEND_SECRET_KEY`
3. Register your M-Pesa shortcode, or use Intasend's shared till for sandbox testing
4. Add both keys to `.env.local`:
   ```
   VITE_INTASEND_PUBLISHABLE_KEY=ISPubKey_...
   INTASEND_SECRET_KEY=ISSecretKey_...   # server-side only — never in VITE_ prefix
   ```

### Step 2 — Create a Supabase Edge Function for payment initiation

Secret keys must **never** touch the browser. A serverless edge function acts as the secure middleman:

- Receives `{ order_id, phone, amount, method }` from the client
- Calls the Intasend API using the secret key
- Returns the transaction reference to the client
- Handles async payment confirmation via webhook

**Files to create:**
- `supabase/functions/initiate-payment/index.ts`
- `supabase/functions/payment-webhook/index.ts`

### Step 3 — Replace `simulatePayment()` in checkout

In `src/pages/Checkout.tsx` (around line 394), replace the fake timer with a real `fetch` call to the edge function:

```typescript
// BEFORE (simulated)
const simulatePayment = async (method: string) => {
  return new Promise((resolve) => setTimeout(resolve, 3000));
};

// AFTER (real)
const initiatePayment = async (method: string) => {
  const res = await fetch('/functions/v1/initiate-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnonKey}` },
    body: JSON.stringify({ order_id: orderId, phone: paymentForm.mpesaPhone, amount: grandTotal, method }),
  });
  if (!res.ok) throw new Error('Payment initiation failed');
  return res.json(); // { reference, status }
};
```

### Step 4 — Webhook to update order status

Intasend/Daraja POSTs a callback when payment is confirmed. The webhook edge function:

1. Verifies the callback signature
2. Looks up the order by `payment_reference`
3. Updates `orders.payment_status = 'paid'` and stores the gateway reference
4. Triggers any post-payment fulfillment logic (e.g., send confirmation email)

### Step 5 — Fix card collection (PCI compliance)

Remove the raw card number input from the checkout form. Use **Intasend Elements** (hosted iframe) or **Stripe Elements** — the full card number never touches your server or codebase, eliminating PCI DSS scope.

### Step 6 — Update order confirmation screen

Show the actual payment reference from the gateway (e.g., Mpesa transaction code) on the confirmation screen instead of just the internal order number.

---

## File Reference

| What | File | Lines | Current Status |
|------|------|-------|---------------|
| Payment submission | `src/pages/Checkout.tsx` | ~203–391 | Form validation only; no API call |
| Simulated payment | `src/pages/Checkout.tsx` | ~394–417 | Fake 2–3s delay, 90% random success |
| Order creation | `src/services/orders/orderService.ts` | ~149–310 | Creates order with `payment_status='pending'` |
| Payment status update | `src/services/orders/orderService.ts` | ~409–452 | Function exists but is never called |
| Saved payment methods | `src/pages/PaymentMethods.tsx` | all | Supabase UI only; not connected to real gateway |
| Saved methods in checkout | `src/pages/Checkout.tsx` | ~1042–1080 | Pre-fills M-Pesa phone only |

---

## Environment Variables Needed

```env
# Intasend (recommended)
VITE_INTASEND_PUBLISHABLE_KEY=ISPubKey_live_...
INTASEND_SECRET_KEY=ISSecretKey_live_...         # edge function only

# OR Safaricom Daraja (M-Pesa direct)
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...
MPESA_PASSKEY=...
MPESA_CALLBACK_URL=https://your-supabase-url.supabase.co/functions/v1/payment-webhook

# OR Stripe (cards)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...                    # edge function only
```

---

## What the Developer Can Build Once Credentials Are Provided

1. Supabase edge function — payment initiation (`initiate-payment`)
2. Supabase edge function — webhook handler (`payment-webhook`)
3. Replace `simulatePayment()` in checkout with real gateway call
4. Update order confirmation screen with actual payment reference
5. Hosted card form (Intasend/Stripe Elements) to remove PCI risk
6. Loading/polling state while waiting for M-Pesa PIN confirmation

---

## Admin-Controlled Payment Methods (Planned Feature)

Payment methods visible to customers should ultimately be toggled on/off by the admin from the Admin Settings page — so the store owner can enable M-Pesa only, add cards later, or offer Pay on Delivery without a code change.

### Intended admin flow (to be built in `/admin/settings`)

Admin sees a list of method types with enable/disable toggles:

- M-Pesa (mobile money)
- Card (Visa / Mastercard)
- Pay on Delivery
- PayPal _(future)_
- Others as needed

Enabled methods are stored in the existing `admin_settings` table:

```sql
INSERT INTO admin_settings (key, value, description)
VALUES (
  'enabled_payment_methods',
  '["mpesa", "card"]',
  'Payment methods available to customers at checkout and in payment method management'
);
```

### What is already hardcoded and needs to change

| Location | Current behaviour | Required change |
| -------- | ----------------- | --------------- |
| `src/pages/Checkout.tsx` | Always shows M-Pesa, Card, Cash on Delivery radio buttons | Filter by `enabled_payment_methods` from `admin_settings` |
| `src/pages/PaymentMethods.tsx` | Type selector always shows `['mpesa', 'card']` | Replace array with query to `admin_settings` |

### Hook to create when Admin Settings supports this

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

Then in both `Checkout.tsx` and `PaymentMethods.tsx`, replace the hardcoded arrays with `enabledMethods` from this hook.

### `saved_payment_methods` table (already built)

See migration: `supabase/migrations/20260529_create_saved_payment_methods.sql`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID | PK |
| user_id | UUID | FK to auth.users |
| type | TEXT | `'mpesa'` or `'card'` |
| label | TEXT | User-defined name |
| phone | TEXT | M-Pesa only |
| card_last4 | TEXT | Card only — last 4 digits |
| card_holder | TEXT | Card only — name on card |
| card_expiry | TEXT | Card only — MM/YY |
| is_default | BOOLEAN | One default per user (unique index) |

---

## Summary

| Area | Status |
|------|--------|
| Database schema (`orders`, `payment_status`, `payment_reference`) | ✅ Ready |
| Checkout UI (M-Pesa phone, card fields) | ✅ Ready |
| Saved payment methods page (user profile) | ✅ Ready |
| `saved_payment_methods` DB table & hook | ✅ Ready |
| Admin toggle for enabled payment methods | ⏳ Planned — needs Admin Settings UI |
| Payment gateway SDK | ❌ Not installed |
| API credentials | ❌ Not configured |
| Real payment API call | ❌ Not implemented |
| Webhook / async confirmation | ❌ Not implemented |
| PCI-compliant card handling | ❌ Not implemented |
| Order status update after payment | ❌ Not implemented |

**Next action:** Register on [intasend.com](https://intasend.com), obtain sandbox keys, and provide them to proceed with full implementation.
