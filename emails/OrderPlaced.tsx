import * as React from "react";
import { EmailLayout, Badge, Divider, ItemsTable, TotalsBlock, ShippingBlock, BaseOrderProps, colors } from "./_shared";
import { Text, Section } from "@react-email/components";

export default function OrderPlaced(props: BaseOrderProps) {
  const {
    order_number, customer_name, items,
    subtotal, shipping_fee, total_amount,
    payment_method,
  } = props;

  return (
    <EmailLayout preview={`We've received your order ${order_number}.`}>
      <Badge label="Order Placed" />
      <Text style={{ fontSize: 20, fontWeight: 700, marginTop: 18, marginBottom: 6 }}>
        Thanks, {customer_name.split(" ")[0]}!
      </Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 0 }}>
        Order <strong>{order_number}</strong> has been received and is awaiting payment confirmation.
      </Text>
      <Divider />
      <ItemsTable items={items} />
      <TotalsBlock subtotal={subtotal} shipping_fee={shipping_fee} total_amount={total_amount} />
      <Divider />
      <ShippingBlock order={props} />
      <Divider />
      <Section style={{ borderLeft: "3px solid #111", padding: "12px 16px", backgroundColor: "#f9f9f9" }}>
        <Text style={{ fontSize: 13, margin: 0 }}>
          {payment_method === "mpesa"
            ? "Check your phone for an M-Pesa STK Push prompt to complete payment."
            : payment_method === "cash_on_delivery"
            ? "Your order will be confirmed once our team processes it. Payment is due on delivery."
            : "Complete your payment to confirm this order."}
        </Text>
      </Section>
    </EmailLayout>
  );
}

OrderPlaced.PreviewProps = {
  order_number: "FUP-2026-001234",
  customer_name: "Jane Doe",
  customer_email: "jane@example.com",
  customer_phone: "+254700000000",
  shipping_address: "123 Ngong Rd",
  shipping_city: "Nairobi",
  shipping_county: "Nairobi",
  subtotal: 4500,
  shipping_fee: 500,
  total_amount: 5000,
  payment_method: "mpesa",
  items: [
    { product_name: "Linen Blazer", color: "Cream", size: "M", quantity: 1, unit_price: 4500, line_total: 4500 },
  ],
} satisfies BaseOrderProps;
