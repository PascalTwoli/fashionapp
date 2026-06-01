/**
 * Admin Order Management Service
 * Functions for admin-level order operations
 */

import { supabase } from "@/integrations/supabase/client";
import {
  AdminOrder,
  OrderFilters,
  OrderAnalytics,
  OrderStatusType,
  AdminOrderNote,
} from "@/types/admin";
import { restoreOrderInventory } from "@/lib/inventoryOperations";

type NotificationEvent =
  | "order_confirmed" | "order_processing" | "order_shipped"
  | "order_delivered" | "order_cancelled";

const STATUS_TO_EVENT: Partial<Record<OrderStatusType, NotificationEvent>> = {
  confirmed:  "order_confirmed",
  processing: "order_processing",
  shipped:    "order_shipped",
  delivered:  "order_delivered",
  cancelled:  "order_cancelled",
};

function fireNotification(event: NotificationEvent, orderId: string) {
  supabase.functions.invoke("send-notification", {
    body: { event, orderId },
  }).catch(err => console.warn(`[notification] ${event} failed:`, err));
}

/**
 * Fetch orders with advanced filtering, searching, and pagination
 */
export const getOrdersWithFilters = async (
  filters: OrderFilters,
  page: number = 1,
  pageSize: number = 20
) => {
  try {
    let query = supabase.from("orders").select("*,order_items(*)", {
      count: "exact",
    });

    // Status filter
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    // Payment status filter
    if (filters.payment_status && filters.payment_status !== "all") {
      query = query.eq("payment_status", filters.payment_status);
    }

    // Payment method filter
    if (filters.payment_method && filters.payment_method !== "all") {
      query = query.eq("payment_method", filters.payment_method);
    }

    // Date range filter
    if (filters.dateRange) {
      query = query
        .gte("placed_at", filters.dateRange.from.toISOString())
        .lte(
          "placed_at",
          new Date(
            filters.dateRange.to.getTime() + 24 * 60 * 60 * 1000
          ).toISOString()
        );
    }

    // Search filter
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(
        `order_number.ilike.${searchTerm},customer_email.ilike.${searchTerm},customer_phone.ilike.${searchTerm},shipping_first_name.ilike.${searchTerm},shipping_last_name.ilike.${searchTerm}`
      );
    }

    // Sorting
    let sortColumn = "placed_at";
    let sortAscending = false;

    if (filters.sort === "oldest") {
      sortAscending = true;
    } else if (filters.sort === "high-value") {
      sortColumn = "total_amount";
      sortAscending = false;
    } else if (filters.sort === "low-value") {
      sortColumn = "total_amount";
      sortAscending = true;
    }

    query = query.order(sortColumn, { ascending: sortAscending });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Orders fetch error:", error);
      return { data: null, error, count: 0 };
    }

    return {
      data: data || [],
      error: null,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (err) {
    console.error("Error fetching orders with filters:", err);
    return { data: null, error: err, count: 0 };
  }
};

/**
 * Get detailed order information
 */
export const getOrderForAdmin = async (
  orderId: string
): Promise<{ data: AdminOrder | null; error: any }> => {
  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) return { data: null, error: "Order not found" };

    // Fetch related data
    const [itemsRes, timelineRes, notesRes] = await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", orderId),
      supabase
        .from("order_timeline")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true }),
      supabase
        .from("admin_order_notes")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false }),
    ]);

    return {
      data: {
        ...order,
        order_items: itemsRes.data || [],
        order_timeline: timelineRes.data || [],
        admin_order_notes: notesRes.data || [],
      },
      error: null,
    };
  } catch (err) {
    console.error("Error fetching order for admin:", err);
    return { data: null, error: err };
  }
};

/**
 * Update order status with timeline entry
 */
export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatusType,
  note?: string,
  adminId?: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    // Restore inventory when an order is cancelled or refunded
    if (newStatus === "cancelled" || newStatus === "refunded") {
      const { errors } = await restoreOrderInventory(orderId);
      if (errors.length > 0) {
        console.warn("Some stock restorations failed:", errors);
      }
    }

    // Create timeline entry
    const { error: timelineError } = await supabase
      .from("order_timeline")
      .insert({
        order_id: orderId,
        status: newStatus,
        note: note || `Order ${newStatus}`,
        created_by: adminId,
      });

    if (timelineError) throw timelineError;

    // Fire status-change notification (fire-and-forget)
    const event = STATUS_TO_EVENT[newStatus];
    if (event) fireNotification(event, orderId);

    return { success: true };
  } catch (err) {
    console.error("Error updating order status:", err);
    return { success: false, error: err };
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
  orderId: string,
  paymentStatus: "paid" | "failed" | "refunded",
  reference?: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        payment_reference: reference || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Error updating payment status:", err);
    return { success: false, error: err };
  }
};

/**
 * Add admin note to order
 */
export const addOrderNote = async (
  orderId: string,
  note: string,
  adminId: string,
  isInternal: boolean = true
): Promise<{ success: boolean; data?: AdminOrderNote; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from("admin_order_notes")
      .insert({
        order_id: orderId,
        admin_id: adminId,
        note,
        is_internal: isInternal,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Error adding order note:", err);
    return { success: false, error: err };
  }
};

/**
 * Update admin note
 */
export const updateOrderNote = async (
  noteId: string,
  note: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from("admin_order_notes")
      .update({
        note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Error updating order note:", err);
    return { success: false, error: err };
  }
};

/**
 * Delete admin note
 */
export const deleteOrderNote = async (
  noteId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from("admin_order_notes")
      .delete()
      .eq("id", noteId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Error deleting order note:", err);
    return { success: false, error: err };
  }
};

/**
 * Get order analytics
 */
export const getOrderAnalytics = async (): Promise<{
  data: OrderAnalytics | null;
  error?: any;
}> => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: orders, error } = await supabase
      .from("orders")
      .select("status, payment_status, total_amount, placed_at");

    if (error) throw error;

    const analytics: OrderAnalytics = {
      total_orders: orders?.length || 0,
      pending_orders: orders?.filter((o) => o.status === "pending").length || 0,
      processing_orders:
        orders?.filter((o) => o.status === "processing").length || 0,
      delivered_orders:
        orders?.filter((o) => o.status === "delivered").length || 0,
      total_revenue: orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
      revenue_this_month:
        orders
          ?.filter(
            (o) => new Date(o.placed_at) >= monthStart && o.payment_status === "paid"
          )
          .reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
      average_order_value:
        (orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0) /
        (orders?.length || 1),
      cancelled_orders:
        orders?.filter((o) => o.status === "cancelled").length || 0,
    };

    return { data: analytics };
  } catch (err) {
    console.error("Error fetching analytics:", err);
    return { data: null, error: err };
  }
};

/**
 * Get low stock products
 */
export const getLowStockAlerts = async (threshold: number = 5) => {
  try {
    const { data, error } = await supabase
      .from("product_variants")
      .select("id,product_id,size,color,stock_quantity,products(name,image_url)")
      .lte("stock_quantity", threshold)
      .order("stock_quantity", { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.error("Error fetching low stock alerts:", err);
    return { data: [], error: err };
  }
};
