import * as React from "react";
import { EmailLayout, Badge, Divider, ItemsTable, TotalsBlock, BaseOrderProps, colors } from "./_shared";
import { Text, Section } from "@react-email/components";

export default function PaymentFailed(props: BaseOrderProps) {
  const { order_number, payment_error, items, subtotal, shipping_fee, total_amount } = props;
  return (
    <EmailLayout preview={`Payment failed for order ${order_number}. Your order has been cancelled.`}>
      <Badge label="Payment Failed & Order Cancelled" color={colors.danger} />
      <Text style={{ fontSize: 20, fontWeight: 700, marginTop: 18 }}>Payment unsuccessful</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
        Your M-Pesa payment for order <strong>{order_number}</strong> could not be processed.
        As a result, your order has been <strong>cancelled</strong>.
      </Text>
      {payment_error && (
        <Section style={{ borderLeft: `3px solid ${colors.danger}`, padding: "12px 16px", backgroundColor: "#fff5f5", marginTop: 20 }}>
          <Text style={{ fontSize: 13, color: colors.danger, margin: 0 }}>{payment_error}</Text>
        </Section>
      )}
      <Divider />
      <ItemsTable items={items} />
      <TotalsBlock subtotal={subtotal} shipping_fee={shipping_fee} total_amount={total_amount} />
      <Divider />
      <Text style={{ fontSize: 13, color: colors.muted }}>
        No charge has been made to your M-Pesa account. You can place a new order if you'd still like these items.
      </Text>
    </EmailLayout>
  );
}

PaymentFailed.PreviewProps = {
  order_number: "FUP-2026-001234", customer_name: "Jane Doe", customer_email: "jane@example.com",
  customer_phone: "+254700000000", shipping_address: "123 Ngong Rd", shipping_city: "Nairobi",
  shipping_county: "Nairobi", subtotal: 4500, shipping_fee: 500, total_amount: 5000,
  payment_method: "mpesa", payment_error: "The customer cancelled the payment.",
  items: [{ product_name: "Linen Blazer", color: "Cream", size: "M", quantity: 1, unit_price: 4500, line_total: 4500 }],
} satisfies BaseOrderProps;
