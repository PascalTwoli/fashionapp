/**
 * payment-webhook
 *
 * Receives the Safaricom STK Push callback and updates the order.
 * Deploy with `--no-verify-jwt` — Safaricom does not send a Supabase JWT.
 *
 * On success: confirm order, deduct inventory.
 * On failure: cancel order, restore inventory, store failure reason.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ok = () =>
  new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

async function adjustInventory(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  direction: "deduct" | "restore"
) {
  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId);

  if (!items || items.length === 0) return;

  for (const item of items) {
    if (!item.variant_id) continue;
    const { data: variant } = await supabase
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", item.variant_id)
      .maybeSingle();
    if (variant) {
      const newQty = direction === "deduct"
        ? Math.max(0, variant.stock_quantity - item.quantity)
        : variant.stock_quantity + item.quantity;
      await supabase
        .from("product_variants")
        .update({ stock_quantity: newQty })
        .eq("id", item.variant_id);
    }
  }
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    const body = await req.json();
    console.log("[payment-webhook] Received:", JSON.stringify(body));

    const callback = body?.Body?.stkCallback;
    if (!callback) return ok();

    const checkoutRequestId: string = callback.CheckoutRequestID;
    const resultCode: number        = callback.ResultCode;
    const resultDesc: string        = callback.ResultDesc ?? "Payment failed";

    let mpesaReceiptNumber: string | null = null;
    if (resultCode === 0 && Array.isArray(callback.CallbackMetadata?.Item)) {
      for (const item of callback.CallbackMetadata.Item) {
        if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = String(item.Value);
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: findErr } = await supabase
      .from("orders")
      .select("id, user_id, order_number, payment_status")
      .eq("mpesa_checkout_request_id", checkoutRequestId)
      .maybeSingle();

    if (findErr || !order) {
      console.error("[payment-webhook] Order not found for", checkoutRequestId, findErr);
      return ok();
    }

    // Idempotency guard
    if (order.payment_status !== "pending") return ok();

    if (resultCode === 0) {
      // ── Payment success ──────────────────────────────────
      // Deduct stock now that payment is confirmed
      await adjustInventory(supabase, order.id, "deduct");

      await supabase
        .from("orders")
        .update({
          payment_status:       "paid",
          status:               "confirmed",
          payment_reference:    mpesaReceiptNumber,
          mpesa_transaction_id: mpesaReceiptNumber,
          payment_error:        null,
          updated_at:           new Date().toISOString(),
        })
        .eq("id", order.id);

      await supabase.from("order_timeline").insert({
        order_id:   order.id,
        status:     "confirmed",
        note:       `M-Pesa payment received. Receipt: ${mpesaReceiptNumber}`,
        created_by: null,
      });

      console.log(`[payment-webhook] Order ${order.order_number} confirmed – receipt ${mpesaReceiptNumber}`);
    } else {
      // ── Payment failure ──────────────────────────────────
      // Inventory is NOT restored here because M-Pesa orders never deduct
      // stock until payment is confirmed. Cancelling the order is enough.
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          status:         "cancelled",
          payment_error:  resultDesc,
          updated_at:     new Date().toISOString(),
        })
        .eq("id", order.id);

      await supabase.from("order_timeline").insert({
        order_id:   order.id,
        status:     "cancelled",
        note:       `Payment failed: ${resultDesc}`,
        created_by: null,
      });

      console.log(`[payment-webhook] Order ${order.order_number} failed: ${resultDesc}`);
    }

    return ok();
  } catch (err) {
    console.error("[payment-webhook] Error:", err);
    return ok(); // always 200 so Safaricom doesn't retry
  }
});
