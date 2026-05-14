/**
 * Professional Status Badges for Admin Dashboard
 */

import React from "react";
import { OrderStatusType, PaymentStatusType, PaymentMethodType, getStatusColor, getPaymentStatusColor, getStatusLabel, getPaymentMethodLabel } from "@/types/admin";

interface StatusBadgeProps {
  status: OrderStatusType;
  className?: string;
}

export const OrderStatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${getStatusColor(status)} ${className}`}>
      {getStatusLabel(status)}
    </span>
  );
};

interface PaymentBadgeProps {
  status: PaymentStatusType;
  className?: string;
}

export const PaymentStatusBadge: React.FC<PaymentBadgeProps> = ({ status, className = "" }) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${getPaymentStatusColor(status)} ${className}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

interface PaymentMethodBadgeProps {
  method: PaymentMethodType;
  className?: string;
}

export const PaymentMethodBadge: React.FC<PaymentMethodBadgeProps> = ({ method, className = "" }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
      {getPaymentMethodLabel(method)}
    </span>
  );
};

interface WarningBadgeProps {
  label: string;
  className?: string;
}

export const WarningBadge: React.FC<WarningBadgeProps> = ({ label, className = "" }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 ${className}`}>
      {label}
    </span>
  );
};
