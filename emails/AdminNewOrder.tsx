import * as React from "react";
import { EmailLayout, Badge, Divider, ItemsTable, TotalsBlock, ShippingBlock, BaseOrderProps, colors } from "./_shared";
import { Text, Row, Column } from "@react-email/components";

export default function AdminNewOrder(props: BaseOrderProps) {
  const { order_number, customer_name, customer_email, customer_phone, items, subtotal, shipping_fee, total_amount, payment_method } = props;
  return (
    <EmailLayout preview={`New order ${order_number} received.`}>
      <Badge label="New Order" />
      <Text style={{ fontSize: 18, fontWeight: 700, marginTop: 18 }}>New order received</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
        A new order has been placed and is awaiting payment confirmation.
      </Text>
      <Divider />
      <Row style={{ marginBottom: 24 }}>
        <Column style={{ paddingRight: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.subtle, margin: 0 }}>Order</Text>
          <Text style={{ fontWeight: 700, fontSize: 15, margin: "4px 0 0" }}>{order_number}</Text>
        </Column>
        <Column>
          <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.subtle, margin: 0 }}>Amount</Text>
          <Text style={{ fontWeight: 700, fontSize: 15, margin: "4px 0 0" }}>KES {total_amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</Text>
        </Column>
      </Row>
      <Row style={{ marginBottom: 24 }}>
        <Column style={{ paddingRight: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.subtle, margin: 0 }}>Customer</Text>
          <Text style={{ fontSize: 13, margin: "4px 0 0" }}>{customer_name}</Text>
          <Text style={{ fontSize: 13, color: colors.muted, margin: "2px 0 0" }}>{customer_email}</Text>
          <Text style={{ fontSize: 13, color: colors.muted, margin: "2px 0 0" }}>{customer_phone}</Text>
        </Column>
        <Column>
          <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.subtle, margin: 0 }}>Payment</Text>
          <Text style={{ fontSize: 13, margin: "4px 0 0" }}>{payment_method === "mpesa" ? "M-Pesa" : payment_method === "cash_on_delivery" ? "Cash on Delivery" : "Card"}</Text>
        </Column>
      </Row>
      <ItemsTable items={items} />
      <TotalsBlock subtotal={subtotal} shipping_fee={shipping_fee} total_amount={total_amount} />
      <Divider />
      <ShippingBlock order={props} />
    </EmailLayout>
  );
}

AdminNewOrder.PreviewProps = {
  order_number: "FUP-2026-001234", customer_name: "Jane Doe", customer_email: "jane@example.com",
  customer_phone: "+254700000000", shipping_address: "123 Ngong Rd", shipping_city: "Nairobi",
  shipping_county: "Nairobi", subtotal: 4500, shipping_fee: 500, total_amount: 5000,
  payment_method: "mpesa",
  items: [{ product_name: "Linen Blazer", color: "Cream", size: "M", quantity: 1, unit_price: 4500, line_total: 4500 }],
} satisfies BaseOrderProps;
