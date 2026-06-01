// ============================================================
// Payment system types
// Phase 1: M-Pesa + Cash on Delivery (single-store)
// Future phases: card, PayPal, multi-seller routing
// ============================================================

export type PaymentMethodCode =
  | "mpesa"
  | "cash_on_delivery"
  | "card"
  | "paypal";

export type PaymentProviderType =
  | "mobile_money"
  | "card"
  | "digital_wallet"
  | "cash";

/** Future: how the platform routes funds. Platform = FashionUp collects first. */
export type PaymentCollectionMode = "platform" | "direct_to_seller";

export interface PaymentProvider {
  id: string;
  provider_code: PaymentMethodCode;
  provider_name: string;
  provider_type: PaymentProviderType;
  enabled: boolean;
  sort_order: number;
  configuration: {
    description?: string;
    countries?: string[];
    note?: string;
    [key: string]: unknown;
  };
}

export interface PlatformSettings {
  enabled_payment_methods: PaymentMethodCode[];
  payment_collection_mode: PaymentCollectionMode;
  default_currency: string;
  // Future marketplace fields – null until Phase 3/4
  commission_type: "percentage" | "flat" | "hybrid" | null;
  commission_value: number | null;
  settlement_frequency: "instant" | "daily" | "weekly" | "monthly";
  automatic_settlements: boolean;
}

// ── Daraja (M-Pesa) ──────────────────────────────────────────

export interface InitiatePaymentRequest {
  order_id: string;
  phone: string;
  amount: number;
}

export interface InitiatePaymentResponse {
  success: boolean;
  checkout_request_id?: string;
  merchant_request_id?: string;
  error?: string;
}

export type MpesaPaymentStatus = "pending" | "paid" | "failed" | "cancelled";

// ── Future: seller payment accounts (Phase 3) ────────────────
// Defined here to lock in the interface before the table exists.
// Credentials are encrypted server-side and NEVER returned to the client.
export interface SellerPaymentAccountShape {
  seller_id: string;
  provider: PaymentMethodCode;
  account_name: string;
  shortcode: string;
  is_verified: boolean;
  is_active: boolean;
}
