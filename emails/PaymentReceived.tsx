import * as React from "react";
import { EmailLayout, Badge, Divider, ItemsTable, TotalsBlock, ShippingBlock, BaseOrderProps, colors } from "./_shared";
import { Text, Section } from "@react-email/components";

export default function PaymentReceived(props: BaseOrderProps) {
  const { order_number, payment_reference, items, subtotal, shipping_fee, total_amount } = props;
  return (
    <EmailLayout preview={`M-Pesa payment for order ${order_number} confirmed.`}>
      <Badge label="Payment Confirmed" color={colors.success} />
      <Text style={{ fontSize: 20, fontWeight: 700, marginTop: 18 }}>Payment received!</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
        Your M-Pesa payment for order <strong>{order_number}</strong> has been confirmed. We're preparing your order now.
      </Text>
      {payment_reference && (
        <Section style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.subtle, margin: 0 }}>M-Pesa Receipt</Text>
          <Text style={{ display: "inline-block", backgroundColor: "#111", color: "#fff", padding: "10px 16px", fontSize: 13, fontWeight: 600, letterSpacing: "0.5px", marginTop: 6 }}>
            {payment_reference}
          </Text>
        </Section>
      )}
      <Divider />
      <ItemsTable items={items} />
      <TotalsBlock subtotal={subtotal} shipping_fee={shipping_fee} total_amount={total_amount} />
      <Divider />
      <ShippingBlock order={props} />
    </EmailLayout>
  );
}

PaymentReceived.PreviewProps = {
  order_number: "FUP-2026-001234", customer_name: "Jane Doe", customer_email: "jane@example.com",
  customer_phone: "+254700000000", shipping_address: "123 Ngong Rd", shipping_city: "Nairobi",
  shipping_county: "Nairobi", subtotal: 4500, shipping_fee: 500, total_amount: 5000,
  payment_method: "mpesa", payment_reference: "QGH7890ABC",
  items: [{ product_name: "Linen Blazer", color: "Cream", size: "M", quantity: 1, unit_price: 4500, line_total: 4500 }],
} satisfies BaseOrderProps;
