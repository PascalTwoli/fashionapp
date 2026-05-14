/**
 * Professional Admin Order Table
 * Responsive, sortable, with pagination
 */

import React, { useState } from "react";
import { ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminOrder } from "@/types/admin";
import { OrderStatusBadge, PaymentStatusBadge } from "./StatusBadges";
import { formatKES } from "@/lib/format";
import { format } from "date-fns";

interface OrderTableProps {
  orders: AdminOrder[];
  isLoading: boolean;
  onOrderSelect: (order: AdminOrder) => void;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  onOrderSelect,
  page,
  pageSize,
  totalPages,
  onPageChange,
  totalCount,
}) => {
  if (isLoading) {
    return (
      <div className="border-b border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Items
                </th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-6 w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-6 w-20" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary mb-4">
          <AlertCircle className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No orders found</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="border-b border-border">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                Items
              </th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-medium text-muted-foreground">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                Payment
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const itemCount = (order.order_items || []).length;
              const totalItems = (order.order_items || []).reduce(
                (sum, item) => sum + item.quantity,
                0
              );

              return (
                <tr
                  key={order.id}
                  className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer group"
                  onClick={() => onOrderSelect(order)}>
                  <td className="px-4 py-3 font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <span>{order.order_number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {order.shipping_first_name} {order.shipping_last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {itemCount} {itemCount === 1 ? "item" : "items"} ({totalItems} qty)
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-sm">
                    {formatKES(order.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={order.payment_status} />
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {format(new Date(order.placed_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-4 flex items-center justify-between border-t border-border bg-background/50">
        <p className="text-xs text-muted-foreground">
          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}{" "}
          orders
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-none text-xs uppercase tracking-wider">
            Previous
          </Button>
          <div className="flex items-center gap-2 px-3 text-sm">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-none text-xs uppercase tracking-wider">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
