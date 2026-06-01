/**
 * Shared layout components for FashionUp React Email templates.
 * Preview locally: npx email dev
 */
import {
  Body, Container, Head, Hr, Html, Preview, Section,
  Text, Row, Column, Img,
} from "@react-email/components";
import * as React from "react";

export interface OrderItem {
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface BaseOrderProps {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_county: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: string;
  payment_reference?: string;
  payment_error?: string;
  items: OrderItem[];
}

export function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

export function paymentLabel(method: string) {
  if (method === "mpesa") return "M-Pesa";
  if (method === "cash_on_delivery") return "Cash on Delivery";
  if (method === "card") return "Card";
  return method;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

export const colors = {
  bg:      "#f5f5f5",
  card:    "#ffffff",
  border:  "#e5e5e5",
  text:    "#111111",
  muted:   "#555555",
  subtle:  "#888888",
  success: "#16a34a",
  danger:  "#dc2626",
};

export const font = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// ─── Layout wrapper ───────────────────────────────────────────────────────────

export function EmailLayout({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.bg, fontFamily: font, margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
          {/* Logo */}
          <Section style={{ paddingBottom: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: colors.text, margin: 0 }}>
              FashionUp
            </Text>
          </Section>

          {/* Card */}
          <Section style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, padding: "40px 36px" }}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: "center", marginTop: 24 }}>
            <Text style={{ fontSize: 12, color: "#999999", lineHeight: "1.6", margin: 0 }}>
              © {new Date().getFullYear()} FashionUp. All rights reserved.
              {"\n"}Nairobi, Kenya · fashionup.vercel.app
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Reusable blocks ──────────────────────────────────────────────────────────

export function Badge({ label, color = colors.text }: { label: string; color?: string }) {
  return (
    <Text style={{
      display: "inline-block", padding: "4px 10px",
      border: `1px solid ${color}`, color,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase",
      margin: 0,
    }}>
      {label}
    </Text>
  );
}

export function Divider() {
  return <Hr style={{ borderColor: colors.border, margin: "28px 0" }} />;
}

export function ItemsTable({ items }: { items: OrderItem[] }) {
  return (
    <Section>
      <Row style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: 10, marginBottom: 0 }}>
        <Column style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.subtle }}>Item</Column>
        <Column style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.subtle, textAlign: "right" }}>Total</Column>
      </Row>
      {items.map((item, i) => (
        <Row key={i} style={{ borderBottom: `1px solid #f0f0f0`, padding: "12px 0" }}>
          <Column>
            <Text style={{ fontWeight: 500, fontSize: 13, margin: 0 }}>{item.product_name}</Text>
            <Text style={{ color: colors.subtle, fontSize: 12, margin: "2px 0 0" }}>
              {item.color} · {item.size} · Qty {item.quantity}
            </Text>
          </Column>
          <Column style={{ textAlign: "right" }}>
            <Text style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{fmt(item.line_total)}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}

export function TotalsBlock({ subtotal, shipping_fee, total_amount }: Pick<BaseOrderProps, "subtotal" | "shipping_fee" | "total_amount">) {
  return (
    <Section style={{ marginTop: 16 }}>
      <Row>
        <Column><Text style={{ fontSize: 13, color: colors.muted, margin: "4px 0" }}>Subtotal</Text></Column>
        <Column style={{ textAlign: "right" }}><Text style={{ fontSize: 13, fontWeight: 500, margin: "4px 0" }}>{fmt(subtotal)}</Text></Column>
      </Row>
      <Row>
        <Column><Text style={{ fontSize: 13, color: colors.muted, margin: "4px 0" }}>Shipping</Text></Column>
        <Column style={{ textAlign: "right" }}><Text style={{ fontSize: 13, fontWeight: 500, margin: "4px 0" }}>{shipping_fee === 0 ? "Free" : fmt(shipping_fee)}</Text></Column>
      </Row>
      <Hr style={{ borderColor: colors.text, margin: "12px 0" }} />
      <Row>
        <Column><Text style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Total</Text></Column>
        <Column style={{ textAlign: "right" }}><Text style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{fmt(total_amount)}</Text></Column>
      </Row>
    </Section>
  );
}

export function ShippingBlock({ order }: { order: BaseOrderProps }) {
  return (
    <Row>
      <Column style={{ paddingRight: 16 }}>
        <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.subtle, marginBottom: 4 }}>Ship to</Text>
        <Text style={{ fontSize: 13, margin: 0 }}>{order.customer_name}</Text>
        <Text style={{ fontSize: 13, color: colors.muted, margin: "2px 0 0" }}>
          {order.shipping_address}{"\n"}{order.shipping_city}, {order.shipping_county}
        </Text>
      </Column>
      <Column>
        <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.subtle, marginBottom: 4 }}>Payment</Text>
        <Text style={{ fontSize: 13, margin: 0 }}>{paymentLabel(order.payment_method)}</Text>
        {order.payment_reference && (
          <Text style={{ fontSize: 13, color: colors.muted, margin: "2px 0 0" }}>Receipt: {order.payment_reference}</Text>
        )}
      </Column>
    </Row>
  );
}
