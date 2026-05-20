/**
 * Admin Order Management Types
 */

export type OrderStatusType = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatusType = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethodType = 'mpesa' | 'card' | 'cash_on_delivery';

export interface AdminOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  product_slug: string;
  product_image: string;
  size: string;
  color: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatusType;
  payment_status: PaymentStatusType;
  payment_method: PaymentMethodType;
  
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  
  customer_email: string;
  customer_phone: string;
  customer_name?: string;
  
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_county: string;
  shipping_country: string;
  delivery_instructions?: string;
  
  payment_reference?: string;
  
  placed_at: string;
  updated_at: string;
  
  order_items?: AdminOrderItem[];
  order_timeline?: OrderTimelineEntry[];
  admin_order_notes?: AdminOrderNote[];
}

export interface OrderTimelineEntry {
  id: string;
  order_id: string;
  status: OrderStatusType;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface AdminOrderNote {
  id: string;
  order_id: string;
  admin_id: string;
  note: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderTableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
}

export interface OrderFilters {
  status?: OrderStatusType | 'all';
  payment_status?: PaymentStatusType | 'all';
  payment_method?: PaymentMethodType | 'all';
  dateRange?: {
    from: Date;
    to: Date;
  };
  sort: 'newest' | 'oldest' | 'high-value' | 'low-value';
  search?: string;
}

export interface OrderAnalytics {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  delivered_orders: number;
  total_revenue: number;
  revenue_this_month: number;
  average_order_value: number;
  cancelled_orders: number;
}

export interface AdminTableState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: OrderFilters;
  search: string;
  selectedOrderId?: string;
}

// Status workflow rules
export const ORDER_STATUS_FLOW: Record<OrderStatusType, OrderStatusType[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

// Color utilities
export const getStatusColor = (status: OrderStatusType): string => {
  const colors: Record<OrderStatusType, string> = {
    pending: 'bg-amber-50 text-amber-900 border-amber-200',
    confirmed: 'bg-slate-100 text-slate-900 border-slate-300',
    processing: 'bg-blue-50 text-blue-900 border-blue-200',
    shipped: 'bg-purple-50 text-purple-900 border-purple-200',
    delivered: 'bg-green-50 text-green-900 border-green-200',
    cancelled: 'bg-red-50 text-red-900 border-red-200',
  };
  return colors[status];
};

export const getPaymentStatusColor = (status: PaymentStatusType): string => {
  const colors: Record<PaymentStatusType, string> = {
    paid: 'bg-green-50 text-green-900 border-green-200',
    pending: 'bg-amber-50 text-amber-900 border-amber-200',
    failed: 'bg-red-50 text-red-900 border-red-200',
    refunded: 'bg-gray-100 text-gray-700 border-gray-300',
  };
  return colors[status];
};

export const getPaymentMethodLabel = (method: PaymentMethodType): string => {
  const labels: Record<PaymentMethodType, string> = {
    mpesa: 'M-Pesa',
    card: 'Card',
    cash_on_delivery: 'Cash on Delivery',
  };
  return labels[method];
};

export const getStatusLabel = (status: OrderStatusType): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};
