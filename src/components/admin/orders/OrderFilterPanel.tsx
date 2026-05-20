/**
 * Admin Order Filters
 */

import React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderFilters, OrderStatusType, PaymentStatusType, PaymentMethodType } from "@/types/admin";

interface OrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onReset: () => void;
}

const ORDER_STATUSES: (OrderStatusType | 'all')[] = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUSES: (PaymentStatusType | 'all')[] = [
  "all",
  "pending",
  "paid",
  "failed",
  "refunded",
];

const PAYMENT_METHODS: (PaymentMethodType | 'all')[] = [
  "all",
  "mpesa",
  "card",
  "cash_on_delivery",
];

export const OrderFilterPanel: React.FC<OrderFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const isFiltered =
    filters.status !== "all" ||
    filters.payment_status !== "all" ||
    filters.payment_method !== "all" ||
    filters.sort !== "newest";

  return (
    <div className="border-b border-border bg-background py-4 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Filter controls */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
          {/* Order Status */}
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
              Order Status
            </label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status: value as OrderStatusType | 'all',
                })
              }>
              <SelectTrigger className="h-10 rounded-none border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
              Payment Status
            </label>
            <Select
              value={filters.payment_status || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  payment_status: value as PaymentStatusType | 'all',
                })
              }>
              <SelectTrigger className="h-10 rounded-none border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "All Payments" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
              Payment Method
            </label>
            <Select
              value={filters.payment_method || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  payment_method: value as PaymentMethodType | 'all',
                })
              }>
              <SelectTrigger className="h-10 rounded-none border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method === "all"
                      ? "All Methods"
                      : method === "mpesa"
                      ? "M-Pesa"
                      : method === "card"
                      ? "Card"
                      : "Cash on Delivery"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
              Sort By
            </label>
            <Select
              value={filters.sort || "newest"}
              onValueChange={(value: any) =>
                onFiltersChange({
                  ...filters,
                  sort: value,
                })
              }>
              <SelectTrigger className="h-10 rounded-none border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="high-value">High Value</SelectItem>
                <SelectItem value="low-value">Low Value</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            {isFiltered && (
              <Button
                onClick={onReset}
                variant="outline"
                size="sm"
                className="w-full h-10 rounded-none text-xs uppercase tracking-wider">
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Active filters display */}
        {isFiltered && (
          <div className="text-xs text-muted-foreground">
            Active filters: {[
              filters.status !== "all" && `Status: ${filters.status}`,
              filters.payment_status !== "all" && `Payment: ${filters.payment_status}`,
              filters.payment_method !== "all" && `Method: ${filters.payment_method}`,
              filters.sort !== "newest" && `Sort: ${filters.sort}`,
            ]
              .filter(Boolean)
              .join(" • ")}
          </div>
        )}
      </div>
    </div>
  );
};
