/**
 * useOrderDetails Hook
 * Fetch full order details with items and timeline
 */

import { useQuery } from "@tanstack/react-query";
import { getOrderDetails } from "@/services/orders/orderService";

export const useOrderDetails = (orderId: string) => {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      console.log("useOrderDetails queryFn called with orderId:", orderId);
      const { data, error } = await getOrderDetails(orderId);
      console.log("getOrderDetails returned - data:", data, "error:", error);
      if (error) {
        console.error("Throwing error from useOrderDetails:", error);
        throw error;
      }
      return data;
    },
    enabled: !!orderId,
  });
};
