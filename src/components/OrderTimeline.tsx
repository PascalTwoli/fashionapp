/**
 * OrderTimeline Component
 * Display order status progression with timeline visualization
 */

import React from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  Clock,
  Truck,
  Home,
  AlertCircle,
  XCircle,
} from "lucide-react";

interface TimelineEntry {
  id: string;
  status: string;
  note?: string;
  created_at: string;
}

interface OrderTimelineProps {
  entries: TimelineEntry[];
  currentStatus: string;
}

const statusIconMap: Record<string, React.ReactNode> = {
  pending: <Clock className="w-5 h-5" />,
  confirmed: <CheckCircle2 className="w-5 h-5" />,
  processing: <CheckCircle2 className="w-5 h-5" />,
  shipped: <Truck className="w-5 h-5" />,
  delivered: <Home className="w-5 h-5" />,
  cancelled: <XCircle className="w-5 h-5" />,
  failed: <AlertCircle className="w-5 h-5" />,
};

const statusColorMap: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
};

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  entries,
  currentStatus,
}) => {
  const sortedEntries = [...entries].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedEntries.map((entry, index) => {
        const isLast = index === sortedEntries.length - 1;
        const statusColor = statusColorMap[entry.status] || "bg-gray-100 text-gray-700";

        return (
          <div key={entry.id} className="flex gap-4">
            {/* Icon */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${statusColor}`}
            >
              {statusIconMap[entry.status] || statusIconMap.pending}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium capitalize">
                    {entry.status.replace(/_/g, " ")}
                  </h4>
                  {entry.note && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {entry.note}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(entry.created_at), "PPpp")}
              </p>
            </div>

            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[1.3rem] top-10 w-0.5 h-12 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
};
