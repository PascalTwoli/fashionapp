/**
 * Custom Hooks for Admin Order Management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getOrdersWithFilters,
  getOrderForAdmin,
  updateOrderStatus,
  updatePaymentStatus,
  addOrderNote,
  updateOrderNote,
  deleteOrderNote,
  getOrderAnalytics,
  getLowStockAlerts,
} from "@/services/orders/adminOrderService";
import { OrderFilters, OrderStatusType, AdminOrder, OrderAnalytics } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to fetch orders with filters and pagination
 */
export const useAdminOrders = (filters: OrderFilters, page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ["admin-orders", filters, page, pageSize],
    queryFn: async () => {
      const result = await getOrdersWithFilters(filters, page, pageSize);
      if (result.error) throw result.error;
      return result;
    },
  });
};

/**
 * Hook to fetch a single order with all details
 */
export const useAdminOrderDetail = (orderId: string) => {
  return useQuery({
    queryKey: ["admin-order-detail", orderId],
    queryFn: async () => {
      const result = await getOrderForAdmin(orderId);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!orderId,
  });
};

/**
 * Hook to update order status
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      orderId,
      newStatus,
      note,
    }: {
      orderId: string;
      newStatus: OrderStatusType;
      note?: string;
    }) => {
      const result = await updateOrderStatus(orderId, newStatus, note, user?.id);
      if (!result.success) throw result.error;
      return result;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
      toast({
        title: "Order status updated",
        description: "The order status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to update payment status
 */
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      orderId,
      paymentStatus,
      reference,
    }: {
      orderId: string;
      paymentStatus: "paid" | "failed" | "refunded";
      reference?: string;
    }) => {
      const result = await updatePaymentStatus(orderId, paymentStatus, reference);
      if (!result.success) throw result.error;
      return result;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
      toast({
        title: "Payment status updated",
        description: "The payment status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update payment status",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to add order note
 */
export const useAddOrderNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      orderId,
      note,
      isInternal,
    }: {
      orderId: string;
      note: string;
      isInternal?: boolean;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const result = await addOrderNote(orderId, note, user.id, isInternal);
      if (!result.success) throw result.error;
      return result.data;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
      toast({
        title: "Note added",
        description: "Your note has been added to the order.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add note",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to update order note
 */
export const useUpdateOrderNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ noteId, note }: { noteId: string; note: string }) => {
      const result = await updateOrderNote(noteId, note);
      if (!result.success) throw result.error;
      return result;
    },
    onSuccess: (_, { noteId }) => {
      // Invalidate all order details queries since we don't know which order this note belongs to
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail"] });
      toast({
        title: "Note updated",
        description: "Your note has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update note",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to delete order note
 */
export const useDeleteOrderNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const result = await deleteOrderNote(noteId);
      if (!result.success) throw result.error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail"] });
      toast({
        title: "Note deleted",
        description: "Your note has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete note",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to fetch order analytics
 */
export const useOrderAnalytics = () => {
  return useQuery({
    queryKey: ["order-analytics"],
    queryFn: async () => {
      const result = await getOrderAnalytics();
      if (result.error) throw result.error;
      return result.data;
    },
  });
};

/**
 * Hook to fetch low stock alerts
 */
export const useLowStockAlerts = (threshold: number = 5) => {
  return useQuery({
    queryKey: ["low-stock-alerts", threshold],
    queryFn: async () => {
      const result = await getLowStockAlerts(threshold);
      if (result.error) throw result.error;
      return result.data;
    },
  });
};
