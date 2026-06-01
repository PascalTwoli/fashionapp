import * as React from "react";
import { EmailLayout, Badge, Divider, ItemsTable, ShippingBlock, BaseOrderProps, colors } from "./_shared";
import { Text, Section } from "@react-email/components";

export default function OrderShipped(props: BaseOrderProps) {
  const { order_number, items, shipping_address, shipping_city, shipping_county } = props;
  return (
    <EmailLayout preview={`Order ${order_number} is on its way to you.`}>
      <Badge label="Shipped" />
      <Text style={{ fontSize: 20, fontWeight: 700, marginTop: 18 }}>Your order is on the way!</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
        Order <strong>{order_number}</strong> has been dispatched and is headed to you.
      </Text>
      <Divider />
      <ItemsTable items={items} />
      <Divider />
      <ShippingBlock order={props} />
      <Divider />
      <Section style={{ borderLeft: "3px solid #111", padding: "12px 16px", backgroundColor: "#f9f9f9" }}>
        <Text style={{ fontSize: 13, margin: 0 }}>
          Deliver to: {shipping_address}, {shipping_city}, {shipping_county}
        </Text>
      </Section>
    </EmailLayout>
  );
}

OrderShipped.PreviewProps = {
  order_number: "FUP-2026-001234", customer_name: "Jane Doe", customer_email: "jane@example.com",
  customer_phone: "+254700000000", shipping_address: "123 Ngong Rd", shipping_city: "Nairobi",
  shipping_county: "Nairobi", subtotal: 4500, shipping_fee: 500, total_amount: 5000,
  payment_method: "mpesa", payment_reference: "QGH7890ABC",
  items: [{ product_name: "Linen Blazer", color: "Cream", size: "M", quantity: 1, unit_price: 4500, line_total: 4500 }],
} satisfies BaseOrderProps;
