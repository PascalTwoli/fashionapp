/**
 * Admin Analytics Cards
 * Dashboard metrics display
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderAnalytics } from "@/types/admin";
import { formatKES } from "@/lib/format";
import { ShoppingBag, Clock, Zap, CheckCircle2, TrendingUp, AlertCircle, Trash2 } from "lucide-react";

interface AnalyticsCardsProps {
  analytics: OrderAnalytics | null;
  isLoading: boolean;
}

export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ analytics, isLoading }) => {
  const cards = [
    {
      icon: ShoppingBag,
      label: "Total Orders",
      value: analytics?.total_orders || 0,
      color: "text-slate-600",
    },
    {
      icon: Clock,
      label: "Pending Orders",
      value: analytics?.pending_orders || 0,
      color: "text-amber-600",
    },
    {
      icon: Zap,
      label: "Processing",
      value: analytics?.processing_orders || 0,
      color: "text-blue-600",
    },
    {
      icon: CheckCircle2,
      label: "Delivered",
      value: analytics?.delivered_orders || 0,
      color: "text-green-600",
    },
    {
      icon: TrendingUp,
      label: "Total Revenue",
      value: formatKES(analytics?.total_revenue || 0),
      isMonetary: true,
      color: "text-slate-600",
    },
    {
      icon: AlertCircle,
      label: "This Month",
      value: formatKES(analytics?.revenue_this_month || 0),
      isMonetary: true,
      color: "text-slate-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className="border-0 bg-white p-6 rounded-none shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  {card.label}
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-display font-medium">
                    {typeof card.value === "string" ? card.value : card.value}
                  </p>
                )}
              </div>
              <Icon className={`w-5 h-5 ${card.color} opacity-60`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
};
