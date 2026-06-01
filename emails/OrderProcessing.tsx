import * as React from "react";
import { EmailLayout, Badge, Divider, ItemsTable, TotalsBlock, ShippingBlock, BaseOrderProps, colors } from "./_shared";
import { Text } from "@react-email/components";

export default function OrderProcessing(props: BaseOrderProps) {
  const { order_number, items, subtotal, shipping_fee, total_amount } = props;
  return (
    <EmailLayout preview={`Order ${order_number} is being prepared.`}>
      <Badge label="Processing" />
      <Text style={{ fontSize: 20, fontWeight: 700, marginTop: 18 }}>We're on it!</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
        Our team is now picking and packing order <strong>{order_number}</strong>. You'll hear from us once it ships.
      </Text>
      <Divider />
      <ItemsTable items={items} />
      <TotalsBlock subtotal={subtotal} shipping_fee={shipping_fee} total_amount={total_amount} />
      <Divider />
      <ShippingBlock order={props} />
    </EmailLayout>
  );
}

OrderProcessing.PreviewProps = {
  order_number: "FUP-2026-001234", customer_name: "Jane Doe", customer_email: "jane@example.com",
  customer_phone: "+254700000000", shipping_address: "123 Ngong Rd", shipping_city: "Nairobi",
  shipping_county: "Nairobi", subtotal: 4500, shipping_fee: 500, total_amount: 5000,
  payment_method: "mpesa",
  items: [{ product_name: "Linen Blazer", color: "Cream", size: "M", quantity: 1, unit_price: 4500, line_total: 4500 }],
} satisfies BaseOrderProps;
