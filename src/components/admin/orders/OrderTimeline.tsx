/**
 * Professional Order Timeline
 * Shows order status history
 */

import React from "react";
import { Clock } from "lucide-react";
import { OrderTimelineEntry, OrderStatusType } from "@/types/admin";
import { format } from "date-fns";
import { getStatusColor, getStatusLabel } from "@/types/admin";

interface OrderTimelineProps {
  timeline: OrderTimelineEntry[];
}

const getStatusIcon = (status: OrderStatusType) => {
  const icons: Record<OrderStatusType, string> = {
    pending: "⏱",
    confirmed: "✓",
    processing: "⚙",
    shipped: "🚚",
    delivered: "✓✓",
    cancelled: "✕",
  };
  return icons[status];
};

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        <p>No timeline events yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="space-y-0">
        {timeline.map((entry, index) => {
          const isLast = index === timeline.length - 1;
          const colorClass = getStatusColor(entry.status);

          return (
            <div key={entry.id} className="relative pb-6">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-[15px] top-10 bottom-0 w-0.5 bg-border" />
              )}

              {/* Timeline node and content */}
              <div className="flex gap-4">
                {/* Timeline dot */}
                <div
                  className={`relative z-10 mt-1.5 flex items-center justify-center w-8 h-8 rounded-full border-2 border-border ${
                    index === 0 ? "bg-foreground" : "bg-background"
                  }`}>
                  <span className="text-xs font-medium">
                    {index === 0 ? (
                      <span className="text-background">{getStatusIcon(entry.status)}</span>
                    ) : (
                      <span className="text-foreground">{getStatusIcon(entry.status)}</span>
                    )}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{getStatusLabel(entry.status)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), "MMM d, yyyy • h:mm a")}
                  </p>
                  {entry.note && entry.note !== `Order ${entry.status}` && (
                    <p className="text-sm mt-1 text-foreground/80">{entry.note}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
