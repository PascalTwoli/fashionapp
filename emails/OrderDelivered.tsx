import * as React from "react";
import { EmailLayout, Badge, Divider, ItemsTable, BaseOrderProps, colors } from "./_shared";
import { Text } from "@react-email/components";

export default function OrderDelivered(props: BaseOrderProps) {
  const { order_number, items } = props;
  return (
    <EmailLayout preview={`Order ${order_number} has been delivered. Enjoy!`}>
      <Badge label="Delivered" color={colors.success} />
      <Text style={{ fontSize: 20, fontWeight: 700, marginTop: 18 }}>Enjoy your fashion!</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
        Order <strong>{order_number}</strong> has been delivered. We hope you love your items!
      </Text>
      <Divider />
      <ItemsTable items={items} />
      <Divider />
      <Text style={{ fontSize: 13, color: colors.muted }}>
        Have questions about your order? Reply to this email and we'll be happy to help.
      </Text>
    </EmailLayout>
  );
}

OrderDelivered.PreviewProps = {
  order_number: "FUP-2026-001234", customer_name: "Jane Doe", customer_email: "jane@example.com",
  customer_phone: "+254700000000", shipping_address: "123 Ngong Rd", shipping_city: "Nairobi",
  shipping_county: "Nairobi", subtotal: 4500, shipping_fee: 500, total_amount: 5000,
  payment_method: "mpesa",
  items: [{ product_name: "Linen Blazer", color: "Cream", size: "M", quantity: 1, unit_price: 4500, line_total: 4500 }],
} satisfies BaseOrderProps;
