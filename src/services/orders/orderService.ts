/**
 * Order Service
 * Handles all order operations: creation, validation, updates, etc.
 */

import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/contexts/CartContext";
import { formatKES } from "@/lib/format";

export interface CreateOrderParams {
  user_id: string;
  items: CartItem[];
  customer_email: string;
  customer_phone: string;
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_county: string;
  shipping_country: string;
  payment_method: "mpesa" | "card" | "cash_on_delivery";
  delivery_instructions?: string;
}

export interface OrderResponse {
  success: boolean;
  order?: {
    id: string;
    order_number: string;
    total_amount: number;
  };
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Generate a unique order number
 * Format: FUP-YYYY-XXXXXX
 */
export const generateOrderNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, "0");

  let orderNumber = `FUP-${year}-${randomNum}`;
  let exists = true;
  let attempts = 0;

  // Ensure uniqueness
  while (exists && attempts < 10) {
    const { data } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (!data) {
      exists = false;
    } else {
      const newRandomNum = Math.floor(Math.random() * 999999)
        .toString()
        .padStart(6, "0");
      orderNumber = `FUP-${year}-${newRandomNum}`;
      attempts++;
    }
  }

  if (attempts >= 10) {
    throw new Error("Failed to generate unique order number");
  }

  return orderNumber;
};

/**
 * Calculate shipping fee based on total
 */
export const calculateShippingFee = (subtotal: number): number => {
  // Free shipping for orders >= 10,000 KES
  if (subtotal >= 10000) return 0;
  // No shipping for zero total (shouldn't happen)
  if (subtotal === 0) return 0;
  // Standard shipping fee
  return 500;
};

/**
 * Validate inventory for all cart items before checkout
 */
export const validateOrderInventory = async (
  items: CartItem[]
): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  for (const item of items) {
    try {
      if (!item.variant_id) {
        errors.push(`No variant ID for ${item.name}`);
        continue;
      }

      const { data: variant, error } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", item.variant_id)
        .maybeSingle();

      if (error) {
        errors.push(`Error checking ${item.name}: ${error.message}`);
        continue;
      }

      if (!variant) {
        errors.push(
          `Variant unavailable: ${item.name} (${item.color}, ${item.size})`
        );
        continue;
      }

      if (variant.stock_quantity < item.quantity) {
        const available = variant.stock_quantity;
        const requested = item.quantity;
        errors.push(
          `${item.name} (${item.color}, ${item.size}): You requested ${requested} but only ${available} ${available === 1 ? "is" : "are"} in stock`
        );
      } else if (variant.stock_quantity === 0) {
        errors.push(
          `${item.name} (${item.color}, ${item.size}) is out of stock`
        );
      }
    } catch (err) {
      errors.push(
        `Unexpected error for ${item.name}: ${err instanceof Error ? err.message : "Unknown"}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Create an order with items and deduct inventory
 * This is a transactional-like operation
 */
export const createOrder = async (
  params: CreateOrderParams
): Promise<OrderResponse> => {
  try {
    // Step 1: Validate inventory
    const inventoryCheck = await validateOrderInventory(params.items);
    if (!inventoryCheck.valid) {
      console.error("Inventory validation errors:", inventoryCheck.errors);
      return {
        success: false,
        error: inventoryCheck.errors.length === 1 
          ? inventoryCheck.errors[0]
          : "Stock issues with some items",
        details: { errors: inventoryCheck.errors },
      };
    }

    // Step 2: Generate order number
    const orderNumber = await generateOrderNumber();

    // Step 3: Calculate totals
    const subtotal = params.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shipping_fee = calculateShippingFee(subtotal);
    const total_amount = subtotal + shipping_fee;

    // Step 4: Create order record
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: params.user_id,
        status: "pending",
        payment_status: "pending",
        payment_method: params.payment_method,
        subtotal,
        shipping_fee,
        total_amount,
        customer_email: params.customer_email,
        customer_phone: params.customer_phone,
        shipping_first_name: params.shipping_first_name,
        shipping_last_name: params.shipping_last_name,
        shipping_address: params.shipping_address,
        shipping_city: params.shipping_city,
        shipping_county: params.shipping_county,
        shipping_country: params.shipping_country,
        delivery_instructions: params.delivery_instructions || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      const errorMessage = orderError.message.includes("permission")
        ? "You don't have permission to create orders. Please check your account status."
        : orderError.message.includes("duplicate")
        ? "An order with this number already exists. Please try again."
        : `Failed to create order: ${orderError.message}`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    if (!order) {
      return {
        success: false,
        error: "Order created but no data returned from database",
      };
    }

    // Ensure order_number and total_amount exist
    if (!order.order_number || order.total_amount === undefined) {
      console.error("Order object missing critical fields:", order);
      return {
        success: false,
        error: "Order created but missing order_number or total_amount",
        details: { order },
      };
    }

    // Step 5: Create order items
    const orderItems = params.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.name,
      product_slug: "", // Will fetch from product
      product_image: item.image,
      size: item.size,
      color: item.color,
      unit_price: item.price,
      quantity: item.quantity,
      line_total: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      // Rollback: delete the order
      await supabase.from("orders").delete().eq("id", order.id);
      console.error("Order items creation error:", itemsError);
      const errorMessage = itemsError.message.includes("permission")
        ? "Permission denied. Unable to save order items."
        : `Failed to save order items: ${itemsError.message}`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Step 6: Create initial timeline entry
    const { error: timelineError } = await supabase.from("order_timeline").insert({
      order_id: order.id,
      status: "pending",
      note: "Order placed",
      created_by: params.user_id,
    });

    if (timelineError) {
      console.error("Timeline creation error:", timelineError);
      // Don't fail the order creation if timeline fails
    }

    // Step 7: Deduct inventory
    const inventoryDeductResult = await deductOrderInventory(
      params.items,
      order.id
    );

    if (!inventoryDeductResult.success) {
      // Rollback: delete order, items, timeline
      await supabase.from("orders").delete().eq("id", order.id);
      console.error("Inventory deduction errors:", inventoryDeductResult.errors);
      return {
        success: false,
        error: inventoryDeductResult.errors.length === 1
          ? inventoryDeductResult.errors[0]
          : "Failed to update product stock",
        details: { errors: inventoryDeductResult.errors },
      };
    }

    return {
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

/**
 * Deduct inventory for all items in an order
 */
export const deductOrderInventory = async (
  items: CartItem[],
  orderId: string
): Promise<{ success: boolean; errors: string[] }> => {
  const errors: string[] = [];

  for (const item of items) {
    try {
      if (!item.variant_id) {
        errors.push(`No variant ID for ${item.name}`);
        continue;
      }

      // Get current stock
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", item.variant_id)
        .maybeSingle();

      if (!variant) {
        errors.push(`Variant not found: ${item.name}`);
        continue;
      }

      const newStock = Math.max(0, variant.stock_quantity - item.quantity);

      // Update stock - only update stock_quantity
      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          stock_quantity: newStock,
        })
        .eq("id", item.variant_id);

      if (updateError) {
        console.error(`Stock update error for ${item.name} (${item.variant_id}):`, updateError);
        errors.push(`Failed to update stock for ${item.name}: ${updateError.message}`);
      }
    } catch (err) {
      errors.push(
        `Unexpected error for ${item.name}: ${err instanceof Error ? err.message : "Unknown"}`
      );
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  newStatus: string,
  note?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create timeline entry
    await supabase.from("order_timeline").insert({
      order_id: orderId,
      status: newStatus,
      note: note || `Order ${newStatus}`,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
  orderId: string,
  paymentStatus: "paid" | "failed" | "refunded",
  reference?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: Record<string, unknown> = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (reference) {
      updateData.payment_reference = reference;
    }

    // If payment succeeded, mark order as confirmed
    if (paymentStatus === "paid") {
      updateData.status = "confirmed";
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Create timeline entry
    await supabase.from("order_timeline").insert({
      order_id: orderId,
      status: paymentStatus === "paid" ? "confirmed" : "pending",
      note: `Payment ${paymentStatus}`,
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

/**
 * Get user's orders
 */
export const getUserOrders = async (userId: string) => {
  return supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      payment_status,
      total_amount,
      placed_at,
      shipping_first_name,
      shipping_last_name
    `
    )
    .eq("user_id", userId)
    .order("placed_at", { ascending: false });
};

/**
 * Get order details with items
 */
export const getOrderDetails = async (orderId: string) => {
  console.log("getOrderDetails called with orderId:", orderId);
  
  // First, fetch the order without nested relations
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError) {
    console.error("Order fetch error:", orderError);
    console.error("Error code:", orderError.code);
    console.error("Error message:", orderError.message);
    return { data: null, error: orderError };
  }

  console.log("Order fetched successfully:", order);
  
  // Then fetch order items and timeline separately
  if (order) {
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    
    const { data: timeline } = await supabase
      .from("order_timeline")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });
    
    return {
      data: {
        ...order,
        order_items: items || [],
        order_timeline: timeline || [],
      },
      error: null,
    };
  }

  return { data: order, error: null };
};
