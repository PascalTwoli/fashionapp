/**
 * OrderStatusBadge Component
 * Display order and payment status with appropriate styling
 */

import React from "react";
import { Badge } from "@/components/ui/badge";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  variant?: "outline" | "secondary" | "default";
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  variant?: "outline" | "secondary" | "default";
}

const statusColorMap: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  processing: "bg-purple-100 text-purple-800 border-purple-300",
  shipped: "bg-cyan-100 text-cyan-800 border-cyan-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

const paymentStatusColorMap: Record<PaymentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  paid: "bg-green-100 text-green-800 border-green-300",
  failed: "bg-red-100 text-red-800 border-red-300",
  refunded: "bg-orange-100 text-orange-800 border-orange-300",
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  variant = "outline",
}) => {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const colorClass = statusColorMap[status];

  return (
    <Badge variant={variant} className={`${colorClass} capitalize`}>
      {label}
    </Badge>
  );
};

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  variant = "outline",
}) => {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const colorClass = paymentStatusColorMap[status];

  return (
    <Badge variant={variant} className={`${colorClass} capitalize`}>
      {label}
    </Badge>
  );
};
