import * as React from "react";
import { EmailLayout, Badge, Divider, ItemsTable, TotalsBlock, ShippingBlock, BaseOrderProps, colors } from "./_shared";
import { Text } from "@react-email/components";

export default function AdminOrderCancelled(props: BaseOrderProps) {
  const { order_number, items, subtotal, shipping_fee, total_amount } = props;
  return (
    <EmailLayout preview={`Order ${order_number} has been cancelled.`}>
      <Badge label="Cancelled" color={colors.danger} />
      <Text style={{ fontSize: 18, fontWeight: 700, marginTop: 18 }}>Order cancelled</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
        Order <strong>{order_number}</strong> has been cancelled.
      </Text>
      <Divider />
      <ItemsTable items={items} />
      <TotalsBlock subtotal={subtotal} shipping_fee={shipping_fee} total_amount={total_amount} />
      <Divider />
      <ShippingBlock order={props} />
    </EmailLayout>
  );
}

AdminOrderCancelled.PreviewProps = {
  order_number: "FUP-2026-001234", customer_name: "Jane Doe", customer_email: "jane@example.com",
  customer_phone: "+254700000000", shipping_address: "123 Ngong Rd", shipping_city: "Nairobi",
  shipping_county: "Nairobi", subtotal: 4500, shipping_fee: 500, total_amount: 5000,
  payment_method: "cash_on_delivery",
  items: [{ product_name: "Linen Blazer", color: "Cream", size: "M", quantity: 1, unit_price: 4500, line_total: 4500 }],
} satisfies BaseOrderProps;
