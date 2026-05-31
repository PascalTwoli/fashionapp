/**
 * initiate-payment
 *
 * Starts an M-Pesa STK Push for an order. Daraja credentials are
 * read from admin_settings (set via Admin → Settings in the app UI).
 *
 * Required Supabase secrets (set automatically by Supabase):
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Credentials configured via Admin UI (stored in admin_settings):
 *   mpesa_consumer_key, mpesa_consumer_secret, mpesa_shortcode,
 *   mpesa_passkey, mpesa_callback_url, mpesa_env
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

/** Read a single key from admin_settings using the service role. */
async function getSetting(admin: ReturnType<typeof createClient>, key: string): Promise<string | null> {
  const { data } = await admin
    .from("admin_settings")
    .select("value")
    .eq("key", key)
    .single();
  const v = data?.value;
  if (v === null || v === undefined) return null;
  // Values are stored as JSONB; strings come back wrapped in quotes
  return typeof v === "string" ? v : JSON.stringify(v).replace(/^"|"$/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // ── Auth ────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return json({ success: false, error: "Unauthorized" }, 401);

    // ── Parse request ───────────────────────────────────────
    const { order_id, phone, amount } = await req.json();
    if (!order_id || !phone || !amount)
      return json({ success: false, error: "Missing required fields: order_id, phone, amount" }, 400);

    // ── Verify order belongs to this user ───────────────────
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, user_id, total_amount, payment_status")
      .eq("id", order_id)
      .single();

    if (orderErr || !order || order.user_id !== user.id)
      return json({ success: false, error: "Order not found" }, 404);

    if (order.payment_status !== "pending")
      return json({ success: false, error: "Order already processed" }, 400);

    // ── Load Daraja credentials from admin_settings ─────────
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [consumerKey, consumerSecret, shortcode, passkey, callbackUrl, mpesaEnv] =
      await Promise.all([
        getSetting(admin, "mpesa_consumer_key"),
        getSetting(admin, "mpesa_consumer_secret"),
        getSetting(admin, "mpesa_shortcode"),
        getSetting(admin, "mpesa_passkey"),
        getSetting(admin, "mpesa_callback_url"),
        getSetting(admin, "mpesa_env"),
      ]);

    if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) {
      console.error("[initiate-payment] Daraja credentials not configured in admin_settings");
      return json({ success: false, error: "M-Pesa is not configured yet. Please contact support." }, 500);
    }

    const base =
      mpesaEnv === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    // ── Step 1: OAuth token ─────────────────────────────────
    const creds = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch(
      `${base}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${creds}` } }
    );
    if (!tokenRes.ok) {
      console.error("[initiate-payment] Token fetch failed:", await tokenRes.text());
      return json({ success: false, error: "Payment gateway authentication failed" }, 502);
    }
    const { access_token } = await tokenRes.json();

    // ── Step 2: STK Push ────────────────────────────────────
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);

    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // Normalise → 2547XXXXXXXX
    let phone_normalised = phone.replace(/\D/g, "");
    if (phone_normalised.startsWith("0")) phone_normalised = "254" + phone_normalised.slice(1);
    if (phone_normalised.startsWith("+")) phone_normalised = phone_normalised.slice(1);

    const stkBody = {
      BusinessShortCode: shortcode,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   "CustomerPayBillOnline",
      Amount:            Math.ceil(Number(amount)),
      PartyA:            phone_normalised,
      PartyB:            shortcode,
      PhoneNumber:       phone_normalised,
      CallBackURL:       callbackUrl,
      AccountReference:  order_id.slice(0, 12),
      TransactionDesc:   "FashionUp Order Payment",
    };

    const stkRes  = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      body:    JSON.stringify(stkBody),
    });
    const stkData = await stkRes.json();
    console.log("[initiate-payment] STK response:", JSON.stringify(stkData));

    if (!stkRes.ok || stkData.ResponseCode !== "0") {
      const msg = stkData.errorMessage || stkData.ResponseDescription || "STK Push failed";
      return json({ success: false, error: msg }, 502);
    }

    // ── Step 3: Store checkout_request_id on the order ──────
    await admin
      .from("orders")
      .update({ mpesa_checkout_request_id: stkData.CheckoutRequestID })
      .eq("id", order_id);

    return json({
      success:             true,
      checkout_request_id: stkData.CheckoutRequestID as string,
      merchant_request_id: stkData.MerchantRequestID as string,
    });
  } catch (err) {
    console.error("[initiate-payment] Unexpected error:", err);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
