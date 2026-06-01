/**
 * send-notification
 *
 * Central notification engine for FashionUp.
 * Triggered by order events (placed, payment confirmed/failed, status changes).
 *
 * Reads SMTP config from admin_settings.
 * Reads per-event toggles from notification_settings.
 * Logs every send attempt in the notifications table.
 *
 * Deploy: supabase functions deploy send-notification
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.0.1/mod.ts";
import {
  NotificationEvent,
  OrderData,
  TemplateResult,
  getEventConfig,
  testEmail,
} from "./templates.ts";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  senderName: string;
  senderEmail: string;
  replyTo?: string;
}

interface NotificationRequest {
  event?: NotificationEvent;
  orderId?: string;
  /** Send a test email — no order required */
  testEmail?: string;
}

// ─── Supabase admin client (service role) ──────────────────────────────────────

function makeSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ─── Load SMTP config from admin_settings ──────────────────────────────────────

async function loadSmtpConfig(supabase: ReturnType<typeof makeSupabase>): Promise<SmtpConfig | null> {
  const keys = [
    "smtp_host", "smtp_port", "smtp_secure",
    "smtp_username", "smtp_password",
    "smtp_sender_name", "smtp_sender_email", "smtp_reply_to",
  ];
  const { data } = await supabase
    .from("admin_settings")
    .select("key, value")
    .in("key", keys);

  if (!data || data.length === 0) return null;

  const map: Record<string, unknown> = {};
  for (const row of data) map[row.key] = row.value;

  const host = map.smtp_host as string | null;
  const username = map.smtp_username as string | null;
  // Strip spaces — Google App Passwords are displayed with spaces but SMTP requires none
  const password = ((map.smtp_password as string | null) ?? "").replace(/\s/g, "") || null;
  const senderEmail = map.smtp_sender_email as string | null;

  if (!host || !username || !password || !senderEmail) return null;

  return {
    host,
    port: (map.smtp_port as number) ?? 587,
    secure: (map.smtp_secure as boolean) ?? false,
    username,
    password,
    senderName: (map.smtp_sender_name as string) || "FashionUp",
    senderEmail,
    replyTo: (map.smtp_reply_to as string | null) ?? undefined,
  };
}

// ─── Load notification toggles ─────────────────────────────────────────────────

async function loadToggles(supabase: ReturnType<typeof makeSupabase>): Promise<Record<string, boolean>> {
  const { data } = await supabase
    .from("notification_settings")
    .select("key, enabled");

  const map: Record<string, boolean> = {};
  for (const row of (data ?? [])) map[row.key] = row.enabled;
  return map;
}

// ─── Load admin recipient emails ───────────────────────────────────────────────

async function loadAdminRecipients(supabase: ReturnType<typeof makeSupabase>): Promise<string[]> {
  const { data } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "admin_email_recipients")
    .maybeSingle();

  const raw = data?.value;
  if (!Array.isArray(raw)) return [];
  return raw.filter((e: unknown) => typeof e === "string" && e.includes("@"));
}

// ─── Fetch order with items ────────────────────────────────────────────────────

async function loadOrder(supabase: ReturnType<typeof makeSupabase>, orderId: string): Promise<OrderData | null> {
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, size, color, quantity, unit_price, line_total, product_image")
    .eq("order_id", orderId);

  return {
    ...order,
    order_items: items ?? [],
  } as OrderData;
}

// ─── Send one email via SMTP ───────────────────────────────────────────────────

async function sendEmail(
  cfg: SmtpConfig,
  to: string,
  template: TemplateResult
): Promise<void> {
  // denomailer uses Deno's native TLS — avoids Node.js compat issues with nodemailer
  const client = new SMTPClient({
    connection: {
      hostname: cfg.host,
      port: cfg.port,
      // false = plain + STARTTLS upgrade (port 587)
      // true  = TLS from start (port 465)
      tls: cfg.secure,
      auth: {
        username: cfg.username,
        password: cfg.password,
      },
    },
  });

  try {
    await client.send({
      from: `"${cfg.senderName}" <${cfg.senderEmail}>`,
      to,
      replyTo: cfg.replyTo ?? undefined,
      subject: template.subject,
      html: template.html,
    });
  } finally {
    await client.close();
  }
}

// ─── Log notification ──────────────────────────────────────────────────────────

async function logNotification(
  supabase: ReturnType<typeof makeSupabase>,
  {
    event, orderId, recipient, audience, status, error,
  }: {
    event: string;
    orderId?: string;
    recipient: string;
    audience: string;
    status: "sent" | "failed" | "skipped";
    error?: string;
  }
) {
  await supabase.from("notifications").insert({
    event,
    order_id: orderId ?? null,
    recipient,
    channel: "email",
    audience,
    status,
    error: error ?? null,
    sent_at: status === "sent" ? new Date().toISOString() : null,
  });
}

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Handler ──────────────────────────────────────────────────────────────────

// Always respond 200 — the Supabase JS client discards the body on non-2xx,
// so callers would only see a generic "non-2xx" error instead of our message.
// Use { success: false, error } in the body to signal failures instead.
function json(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: CORS });
  }

  try {
    const body: NotificationRequest = await req.json();
    const supabase = makeSupabase();

    // ── Test email ─────────────────────────────────────────────────────────────
    if (body.testEmail) {
      const cfg = await loadSmtpConfig(supabase);
      if (!cfg) {
        return json({
          success: false,
          error: "SMTP is not configured. Fill in Host, Username, Password, and Sender Email in the Email Configuration section above, then save.",
        });
      }
      try {
        await sendEmail(cfg, body.testEmail, testEmail(cfg.senderName));
        return json({ success: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[send-notification] Test email failed:", msg);
        return json({ success: false, error: msg });
      }
    }

    // ── Order event ───────────────────────────────────────────────────────────
    const { event, orderId } = body;
    if (!event || !orderId) {
      return json({ success: false, error: "event and orderId are required" });
    }

    const eventConfig = getEventConfig(event);
    if (!eventConfig) {
      return json({ success: false, error: `Unknown event: ${event}` });
    }

    const [cfg, toggles, adminRecipients, order] = await Promise.all([
      loadSmtpConfig(supabase),
      loadToggles(supabase),
      loadAdminRecipients(supabase),
      loadOrder(supabase, orderId),
    ]);

    if (!order) {
      console.warn(`[send-notification] Order not found: ${orderId}`);
      return json({ success: false, error: "Order not found" });
    }

    const results: Array<{ recipient: string; status: string; error?: string }> = [];

    // Logging is best-effort — a missing notifications table must never prevent email delivery.
    const safeLog = (...args: Parameters<typeof logNotification>) =>
      logNotification(...args).catch(e => console.warn("[send-notification] log failed:", e));

    console.log(`[send-notification] event=${event} orderId=${orderId} hasCfg=${!!cfg} recipients=${adminRecipients.length}`);

    // ── Customer email ─────────────────────────────────────────────────────────
    const customerEnabled = toggles[eventConfig.customerKey] !== false;
    if (customerEnabled && order.customer_email) {
      if (!cfg) {
        await safeLog(supabase, { event, orderId, recipient: order.customer_email, audience: "customer", status: "skipped", error: "SMTP not configured" });
        results.push({ recipient: order.customer_email, status: "skipped", error: "SMTP not configured" });
      } else {
        try {
          await sendEmail(cfg, order.customer_email, eventConfig.customer(order));
          console.log(`[send-notification] customer email sent → ${order.customer_email}`);
          await safeLog(supabase, { event, orderId, recipient: order.customer_email, audience: "customer", status: "sent" });
          results.push({ recipient: order.customer_email, status: "sent" });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[send-notification] customer email FAILED → ${order.customer_email}:`, msg);
          await safeLog(supabase, { event, orderId, recipient: order.customer_email, audience: "customer", status: "failed", error: msg });
          results.push({ recipient: order.customer_email, status: "failed", error: msg });
        }
      }
    }

    // ── Admin emails ───────────────────────────────────────────────────────────
    if (eventConfig.adminKey && eventConfig.admin) {
      const adminEnabled = toggles[eventConfig.adminKey] !== false;
      if (adminEnabled && adminRecipients.length > 0) {
        const tmpl = eventConfig.admin(order);
        for (const adminEmail of adminRecipients) {
          if (!cfg) {
            await safeLog(supabase, { event, orderId, recipient: adminEmail, audience: "admin", status: "skipped", error: "SMTP not configured" });
            results.push({ recipient: adminEmail, status: "skipped", error: "SMTP not configured" });
          } else {
            try {
              await sendEmail(cfg, adminEmail, tmpl);
              console.log(`[send-notification] admin email sent → ${adminEmail}`);
              await safeLog(supabase, { event, orderId, recipient: adminEmail, audience: "admin", status: "sent" });
              results.push({ recipient: adminEmail, status: "sent" });
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error(`[send-notification] admin email FAILED → ${adminEmail}:`, msg);
              await safeLog(supabase, { event, orderId, recipient: adminEmail, audience: "admin", status: "failed", error: msg });
              results.push({ recipient: adminEmail, status: "failed", error: msg });
            }
          }
        }
      }
    }

    console.log(`[send-notification] event=${event} orderId=${orderId} results=`, JSON.stringify(results));
    return json({ success: true, results });

  } catch (err) {
    console.error("[send-notification] Unhandled error:", err);
    return json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});
