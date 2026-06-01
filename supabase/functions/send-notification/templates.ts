/**
 * FashionUp HTML email templates
 * Pure TypeScript — no React, safe for Deno edge functions.
 * All templates return a { subject, html } pair.
 */

export interface OrderData {
  order_number: string;
  customer_email: string;
  customer_phone: string;
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_county: string;
  total_amount: number;
  subtotal: number;
  shipping_fee: number;
  payment_method: string;
  payment_reference?: string | null;
  payment_error?: string | null;
  status: string;
  placed_at: string;
  order_items: Array<{
    product_name: string;
    size: string;
    color: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    product_image?: string;
  }>;
}

export interface TemplateResult {
  subject: string;
  html: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function paymentMethodLabel(method: string) {
  if (method === "mpesa") return "M-Pesa";
  if (method === "cash_on_delivery") return "Cash on Delivery";
  if (method === "card") return "Card";
  return method;
}

// Strip newlines + leading whitespace so QP encoding never emits =20 artifacts.
// Safe for block-level HTML — whitespace between block tags is insignificant.
function minifyHtml(html: string): string {
  return html
    .replace(/\n\s*/g, "")   // newlines + their indentation → gone
    .replace(/ {2,}/g, " ")  // multiple spaces → single space
    .replace(/> </g, "><")   // whitespace between closing and opening tags → gone
    .trim();
}

function base(title: string, preview: string, body: string): string {
  return minifyHtml(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background-color: #f5f5f5; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; }
  a { color: #111; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
  .card { background: #fff; border: 1px solid #e5e5e5; padding: 40px 36px; }
  .logo { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #111; text-decoration: none; }
  .divider { border: none; border-top: 1px solid #e5e5e5; margin: 28px 0; }
  .badge { display: inline-block; padding: 4px 10px; border: 1px solid #111; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; }
  .order-meta { font-size: 13px; color: #555; margin-top: 6px; }
  .items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .items-table th { text-align: left; font-weight: 600; font-size: 11px; letter-spacing: 0.6px; text-transform: uppercase; color: #888; padding-bottom: 10px; border-bottom: 1px solid #e5e5e5; }
  .items-table td { padding: 12px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .items-table td:last-child { text-align: right; white-space: nowrap; }
  .totals { font-size: 13px; }
  .totals tr td { padding: 4px 0; }
  .totals tr td:last-child { text-align: right; font-weight: 500; }
  .totals .grand-total td { font-size: 15px; font-weight: 700; padding-top: 12px; border-top: 1px solid #111; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 13px; }
  .info-label { font-size: 11px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase; color: #888; margin-bottom: 4px; }
  .receipt-badge { background: #111; color: #fff; padding: 10px 16px; font-size: 13px; font-weight: 600; display: inline-block; letter-spacing: 0.5px; }
  .alert-box { border-left: 3px solid #111; padding: 12px 16px; background: #f9f9f9; font-size: 13px; }
  .footer { text-align: center; font-size: 12px; color: #999; margin-top: 24px; line-height: 1.6; }
  @media (max-width: 480px) {
    .card { padding: 28px 20px; }
    .info-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div role="presentation" style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#ffffff;">${preview}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<div class="wrapper">
  <div style="padding: 16px 0 20px;">
    <span class="logo">FashionUp</span>
  </div>
  <div class="card">
    ${body}
  </div>
  <div class="footer">
    &copy; ${new Date().getFullYear()} FashionUp. All rights reserved.<br />
    Nairobi, Kenya &middot; <a href="https://fashionup.co.ke" style="color:#999;">fashionup.co.ke</a>
  </div>
</div>
</body>
</html>`);
}

function itemsSection(items: OrderData["order_items"]) {
  const rows = items.map(item => `
    <tr>
      <td>
        <div style="font-weight:500;">${item.product_name}</div>
        <div style="color:#888;font-size:12px;margin-top:2px;">${item.color} · ${item.size} · Qty ${item.quantity}</div>
      </td>
      <td>${fmt(item.line_total)}</td>
    </tr>`).join("");

  return `
    <table class="items-table">
      <thead><tr><th>Item</th><th style="text-align:right;">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function totalsSection(order: OrderData) {
  return `
    <table class="totals" style="width:100%;margin-top:16px;">
      <tr><td style="color:#555;">Subtotal</td><td>${fmt(order.subtotal)}</td></tr>
      <tr><td style="color:#555;">Shipping</td><td>${order.shipping_fee === 0 ? "Free" : fmt(order.shipping_fee)}</td></tr>
      <tr class="grand-total"><td>Total</td><td>${fmt(order.total_amount)}</td></tr>
    </table>`;
}

function shippingSection(order: OrderData) {
  return `
    <div class="info-grid" style="margin-top:0;">
      <div>
        <div class="info-label">Ship to</div>
        <div>${order.shipping_first_name} ${order.shipping_last_name}</div>
        <div style="color:#555;">${order.shipping_address}<br />${order.shipping_city}, ${order.shipping_county}</div>
      </div>
      <div>
        <div class="info-label">Payment</div>
        <div>${paymentMethodLabel(order.payment_method)}</div>
        ${order.payment_reference ? `<div style="color:#555;margin-top:2px;">Receipt: ${order.payment_reference}</div>` : ""}
      </div>
    </div>`;
}

// ─── Customer Templates ────────────────────────────────────────────────────────

export function orderPlaced(order: OrderData): TemplateResult {
  const subject = `Order Confirmed — ${order.order_number}`;
  const html = base(subject, `We've received your order ${order.order_number}.`, `
    <div class="badge">Order Placed</div>
    <h2 style="font-size:20px;font-weight:700;margin-top:18px;">Thanks, ${order.shipping_first_name}!</h2>
    <p class="order-meta">Order <strong>${order.order_number}</strong> has been received and is awaiting payment confirmation.</p>
    <hr class="divider" />
    ${itemsSection(order.order_items)}
    ${totalsSection(order)}
    <hr class="divider" />
    ${shippingSection(order)}
    <hr class="divider" />
    <div class="alert-box">
      ${order.payment_method === "mpesa"
        ? "Check your phone for an M-Pesa STK Push prompt to complete payment."
        : order.payment_method === "cash_on_delivery"
        ? "Your order will be confirmed once our team processes it. Payment is due on delivery."
        : "Complete your payment to confirm this order."}
    </div>
  `);
  return { subject, html };
}

export function paymentReceived(order: OrderData): TemplateResult {
  const subject = `Payment Received — ${order.order_number}`;
  const html = base(subject, `Your M-Pesa payment for order ${order.order_number} was successful.`, `
    <div class="badge" style="border-color:#16a34a;color:#16a34a;">Payment Confirmed</div>
    <h2 style="font-size:20px;font-weight:700;margin-top:18px;">Payment received!</h2>
    <p class="order-meta">Your M-Pesa payment for order <strong>${order.order_number}</strong> has been confirmed. We're preparing your order now.</p>
    ${order.payment_reference ? `<div style="margin-top:20px;"><div class="info-label">M-Pesa Receipt</div><span class="receipt-badge">${order.payment_reference}</span></div>` : ""}
    <hr class="divider" />
    ${itemsSection(order.order_items)}
    ${totalsSection(order)}
    <hr class="divider" />
    ${shippingSection(order)}
  `);
  return { subject, html };
}

export function paymentFailed(order: OrderData): TemplateResult {
  const subject = `Payment Failed — Order ${order.order_number} Cancelled`;
  const html = base(subject, `Payment failed for order ${order.order_number}. Your order has been cancelled.`, `
    <div class="badge" style="border-color:#dc2626;color:#dc2626;">Payment Failed &amp; Order Cancelled</div>
    <h2 style="font-size:20px;font-weight:700;margin-top:18px;">Payment unsuccessful</h2>
    <p class="order-meta">
      Your M-Pesa payment for order <strong>${order.order_number}</strong> could not be processed.
      As a result, your order has been <strong>cancelled</strong>.
    </p>
    ${order.payment_error ? `<div class="alert-box" style="margin-top:20px;border-color:#dc2626;">${order.payment_error}</div>` : ""}
    <hr class="divider" />
    ${itemsSection(order.order_items)}
    ${totalsSection(order)}
    <hr class="divider" />
    <p style="font-size:13px;color:#555;">
      No charge has been made to your M-Pesa account. You can place a new order if you'd still like these items.
    </p>
  `);
  return { subject, html };
}

export function orderConfirmed(order: OrderData): TemplateResult {
  const subject = `Order Confirmed — ${order.order_number}`;
  const html = base(subject, `Your order ${order.order_number} has been confirmed.`, `
    <div class="badge">Order Confirmed</div>
    <h2 style="font-size:20px;font-weight:700;margin-top:18px;">Your order is confirmed!</h2>
    <p class="order-meta">Order <strong>${order.order_number}</strong> has been confirmed and will soon move to processing.</p>
    <hr class="divider" />
    ${itemsSection(order.order_items)}
    ${totalsSection(order)}
    <hr class="divider" />
    ${shippingSection(order)}
  `);
  return { subject, html };
}

export function orderProcessing(order: OrderData): TemplateResult {
  const subject = `We're preparing your order — ${order.order_number}`;
  const html = base(subject, `Order ${order.order_number} is now being processed.`, `
    <div class="badge">Processing</div>
    <h2 style="font-size:20px;font-weight:700;margin-top:18px;">We're on it!</h2>
    <p class="order-meta">Our team is now picking and packing order <strong>${order.order_number}</strong>. You'll hear from us once it ships.</p>
    <hr class="divider" />
    ${itemsSection(order.order_items)}
    ${totalsSection(order)}
    <hr class="divider" />
    ${shippingSection(order)}
  `);
  return { subject, html };
}

export function orderShipped(order: OrderData): TemplateResult {
  const subject = `Your order has shipped — ${order.order_number}`;
  const html = base(subject, `Order ${order.order_number} is on its way to you.`, `
    <div class="badge">Shipped</div>
    <h2 style="font-size:20px;font-weight:700;margin-top:18px;">Your order is on the way!</h2>
    <p class="order-meta">Order <strong>${order.order_number}</strong> has been dispatched and is headed to you.</p>
    <hr class="divider" />
    ${itemsSection(order.order_items)}
    <hr class="divider" />
    ${shippingSection(order)}
    <hr class="divider" />
    <div class="alert-box">Deliver to: ${order.shipping_address}, ${order.shipping_city}, ${order.shipping_county}</div>
  `);
  return { subject, html };
}

export function orderDelivered(order: OrderData): TemplateResult {
  const subject = `Your order has been delivered — ${order.order_number}`;
  const html = base(subject, `Order ${order.order_number} has been delivered. Enjoy!`, `
    <div class="badge" style="border-color:#16a34a;color:#16a34a;">Delivered</div>
    <h2 style="font-size:20px;font-weight:700;margin-top:18px;">Enjoy your fashion!</h2>
    <p class="order-meta">Order <strong>${order.order_number}</strong> has been delivered. We hope you love your items!</p>
    <hr class="divider" />
    ${itemsSection(order.order_items)}
    <hr class="divider" />
    <p style="font-size:13px;color:#555;">Have questions about your order? Reply to this email and we'll be happy to help.</p>
  `);
  return { subject, html };
}

export function orderCancelled(order: OrderData): TemplateResult {
  const subject = `Order Cancelled — ${order.order_number}`;
  const html = base(subject, `Order ${order.order_number} has been cancelled.`, `
    <div class="badge" style="border-color:#dc2626;color:#dc2626;">Cancelled</div>
    <h2 style="font-size:20px;font-weight:700;margin-top:18px;">Your order has been cancelled</h2>
    <p class="order-meta">Order <strong>${order.order_number}</strong> has been cancelled.</p>
    <hr class="divider" />
    ${itemsSection(order.order_items)}
    ${totalsSection(order)}
    <hr class="divider" />
    <p style="font-size:13px;color:#555;">If you were charged and believe this is an error, please contact us. Refunds are processed within 3–5 business days.</p>
  `);
  return { subject, html };
}

// ─── Admin Templates ───────────────────────────────────────────────────────────

function adminOrderSummary(order: OrderData) {
  return `
    <div class="info-grid" style="margin-bottom:24px;">
      <div><div class="info-label">Order</div><strong>${order.order_number}</strong></div>
      <div><div class="info-label">Amount</div><strong>${fmt(order.total_amount)}</strong></div>
      <div><div class="info-label">Customer</div>${order.shipping_first_name} ${order.shipping_last_name}<br /><span style="color:#555;">${order.customer_email}</span><br /><span style="color:#555;">${order.customer_phone}</span></div>
      <div><div class="info-label">Payment</div>${paymentMethodLabel(order.payment_method)}${order.payment_reference ? `<br /><span style="color:#555;">Receipt: ${order.payment_reference}</span>` : ""}</div>
    </div>
    ${itemsSection(order.order_items)}
    ${totalsSection(order)}`;
}

export function adminNewOrder(order: OrderData): TemplateResult {
  const subject = `[FashionUp] New Order — ${order.order_number}`;
  const html = base(subject, `New order ${order.order_number} received.`, `
    <div class="badge">New Order</div>
    <h2 style="font-size:18px;font-weight:700;margin-top:18px;">New order received</h2>
    <p class="order-meta" style="margin-bottom:24px;">A new order has been placed and is awaiting payment confirmation.</p>
    ${adminOrderSummary(order)}
    <hr class="divider" />
    ${shippingSection(order)}
  `);
  return { subject, html };
}

export function adminPaymentReceived(order: OrderData): TemplateResult {
  const subject = `[FashionUp] Payment Confirmed — ${order.order_number}`;
  const html = base(subject, `Payment confirmed for order ${order.order_number}.`, `
    <div class="badge" style="border-color:#16a34a;color:#16a34a;">Payment Confirmed</div>
    <h2 style="font-size:18px;font-weight:700;margin-top:18px;">Payment received — order ready to process</h2>
    <p class="order-meta" style="margin-bottom:24px;">M-Pesa payment confirmed for order <strong>${order.order_number}</strong>.</p>
    ${adminOrderSummary(order)}
    <hr class="divider" />
    ${shippingSection(order)}
  `);
  return { subject, html };
}

export function adminPaymentFailed(order: OrderData): TemplateResult {
  const subject = `[FashionUp] Payment Failed — ${order.order_number} (Auto-Cancelled)`;
  const html = base(subject, `Payment failed for order ${order.order_number}. Order auto-cancelled.`, `
    <div class="badge" style="border-color:#dc2626;color:#dc2626;">Payment Failed &amp; Auto-Cancelled</div>
    <h2 style="font-size:18px;font-weight:700;margin-top:18px;">Payment failed — order auto-cancelled</h2>
    <p class="order-meta" style="margin-bottom:24px;">
      M-Pesa payment for order <strong>${order.order_number}</strong> was not completed.
      The order has been automatically cancelled and no stock was deducted.
    </p>
    ${order.payment_error ? `<div class="alert-box" style="margin-bottom:24px;border-color:#dc2626;">${order.payment_error}</div>` : ""}
    ${adminOrderSummary(order)}
  `);
  return { subject, html };
}

export function adminOrderCancelled(order: OrderData): TemplateResult {
  const subject = `[FashionUp] Order Cancelled — ${order.order_number}`;
  const html = base(subject, `Order ${order.order_number} has been cancelled.`, `
    <div class="badge" style="border-color:#dc2626;color:#dc2626;">Cancelled</div>
    <h2 style="font-size:18px;font-weight:700;margin-top:18px;">Order cancelled</h2>
    <p class="order-meta" style="margin-bottom:24px;">Order <strong>${order.order_number}</strong> has been cancelled.</p>
    ${adminOrderSummary(order)}
    <hr class="divider" />
    ${shippingSection(order)}
  `);
  return { subject, html };
}

// ─── Test template ─────────────────────────────────────────────────────────────

export function testEmail(senderName: string): TemplateResult {
  return {
    subject: `[FashionUp] Email Configuration Test`,
    html: base("Email Test", "Your FashionUp email configuration is working.", `
      <div class="badge" style="border-color:#16a34a;color:#16a34a;">Test Email</div>
      <h2 style="font-size:20px;font-weight:700;margin-top:18px;">Email is working!</h2>
      <p style="margin-top:12px;font-size:14px;color:#555;">
        This test email was sent from <strong>${senderName || "FashionUp"}</strong>.<br />
        Your SMTP configuration is set up correctly.
      </p>
      <hr class="divider" />
      <p style="font-size:13px;color:#999;">
        You can now enable email notifications from the Notifications settings page.
      </p>
    `),
  };
}

// ─── Event router ──────────────────────────────────────────────────────────────

export type NotificationEvent =
  | "order_placed"
  | "payment_received"
  | "payment_failed"
  | "order_confirmed"
  | "order_processing"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled";

/** Returns { customerKey, adminKey, customerTemplate, adminTemplate } for an event. */
export function getEventConfig(event: NotificationEvent) {
  const map: Record<NotificationEvent, {
    customerKey: string;
    adminKey: string | null;
    customer: (o: OrderData) => TemplateResult;
    admin: ((o: OrderData) => TemplateResult) | null;
  }> = {
    order_placed:     { customerKey: "customer_order_placed",     adminKey: "admin_new_order",         customer: orderPlaced,     admin: adminNewOrder },
    payment_received: { customerKey: "customer_payment_received", adminKey: "admin_payment_received",  customer: paymentReceived, admin: adminPaymentReceived },
    payment_failed:   { customerKey: "customer_payment_failed",   adminKey: "admin_payment_failed",    customer: paymentFailed,   admin: adminPaymentFailed },
    order_confirmed:  { customerKey: "customer_order_confirmed",  adminKey: null,                      customer: orderConfirmed,  admin: null },
    order_processing: { customerKey: "customer_order_processing", adminKey: null,                      customer: orderProcessing, admin: null },
    order_shipped:    { customerKey: "customer_order_shipped",    adminKey: null,                      customer: orderShipped,    admin: null },
    order_delivered:  { customerKey: "customer_order_delivered",  adminKey: null,                      customer: orderDelivered,  admin: null },
    order_cancelled:  { customerKey: "customer_order_cancelled",  adminKey: "admin_order_cancelled",   customer: orderCancelled,  admin: adminOrderCancelled },
  };
  return map[event];
}
