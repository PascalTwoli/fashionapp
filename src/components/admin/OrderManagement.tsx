
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
  products: {
    name: string;
    image_url: string | null;
  };
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number | null;
  created_at: string;
  updated_at: string;
  profiles: {
    name: string;
  };
  order_items: OrderItem[];
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (name),
          order_items (
            *,
            products (name, image_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'shipped': return 'outline';
      case 'delivered': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="text-sm text-gray-500">
          Total Orders: {orders.length}
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                  <CardDescription>
                    Customer: {order.profiles?.name || 'Unknown'} • 
                    Created: {new Date(order.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <Select 
                    value={order.status} 
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    {item.products?.image_url && (
                      <img 
                        src={item.products.image_url} 
                        alt={item.products.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.products?.name}</h4>
                      <div className="text-sm text-gray-600">
                        Quantity: {item.quantity} • Price: ${item.price.toFixed(2)}
                        {item.size && ` • Size: ${item.size}`}
                        {item.color && ` • Color: ${item.color}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {order.total_amount && (
                  <div className="flex justify-end pt-3 border-t">
                    <div className="text-lg font-bold">
                      Total: ${order.total_amount.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders found.</p>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
