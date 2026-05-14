/**
 * useOrders Hook
 * Fetch user's order history
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getUserOrders } from "@/services/orders/orderService";

export const useOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await getUserOrders(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};
