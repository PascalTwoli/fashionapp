/**
 * Low Stock Alerts
 * Shows products/variants with low inventory
 */

import React from "react";
import { AlertCircle, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StockItem {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock_quantity: number;
  products?: {
    name: string;
    image_url?: string;
  };
}

interface LowStockAlertsProps {
  items: StockItem[];
  isLoading: boolean;
  threshold?: number;
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({
  items,
  isLoading,
  threshold = 5,
}) => {
  if (isLoading) {
    return (
      <Card className="border-0 bg-amber-50 p-4 rounded-none">
        <Skeleton className="h-6 w-32" />
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="border border-green-200 bg-green-50 p-4 rounded-none">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-green-600" />
          <p className="text-sm font-medium text-green-900">All products in stock</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-amber-200 bg-amber-50 p-4 rounded-none">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-amber-900 mb-3">
            {items.length} product{items.length !== 1 ? "s" : ""} with low stock
          </p>
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="text-xs text-amber-900 bg-white/50 p-2 rounded border border-amber-200">
                <p className="font-medium">
                  {item.products?.name} {item.size && `- ${item.size}`} {item.color && `(${item.color})`}
                </p>
                <p className="text-amber-700">
                  {item.stock_quantity} units left {item.stock_quantity === 0 && "(Out of stock)"}
                </p>
              </div>
            ))}
            {items.length > 5 && (
              <p className="text-xs text-amber-700 italic">
                +{items.length - 5} more low stock items
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
