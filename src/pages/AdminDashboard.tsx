
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, ShoppingCart, Users, Settings, Truck, CreditCard, Smartphone, ImageIcon, ChevronRight } from 'lucide-react';
import ProductManagement from '@/components/admin/ProductManagement';
import AdvancedOrderManagement from '@/components/admin/AdvancedOrderManagement';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const defaultTab = (location.state as any)?.tab ?? "products";
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalUsers: 0
  });

  // Handle auth loading - redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Handle admin check - only redirect if role loading is complete and user is not admin
  useEffect(() => {
    if (!roleLoading && user && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, roleLoading, user, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAdmin) return;

      try {
        const [productsRes, ordersRes, pendingOrdersRes, profilesRes] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact' }),
          supabase.from('orders').select('id', { count: 'exact' }),
          supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
          supabase.from('profiles').select('id', { count: 'exact' })
        ]);

        setStats({
          totalProducts: productsRes.count || 0,
          totalOrders: ordersRes.count || 0,
          pendingOrders: pendingOrdersRes.count || 0,
          totalUsers: profilesRes.count || 0
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      }
    };

    fetchStats();
  }, [isAdmin]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Fixed admin header — h-14 (56px), section sub-headers use sticky top-14 */}
      <header className="sticky top-0 z-30 h-14 bg-background border-b border-border flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Manage your fashion store</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/')}>
            Back to Store
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Product Management</TabsTrigger>
            <TabsTrigger value="orders">Order Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>
          
          <TabsContent value="orders">
            <AdvancedOrderManagement />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Select a settings category to configure.
              </p>
              {[
                {
                  icon: Truck,
                  title: "Shipping",
                  description: "Delivery fees and free shipping threshold",
                  href: "/admin/settings/shipping",
                },
                {
                  icon: CreditCard,
                  title: "Payment Methods",
                  description: "Enable or disable checkout payment options",
                  href: "/admin/settings/payment-methods",
                },
                {
                  icon: Smartphone,
                  title: "M-Pesa / Daraja",
                  description: "Safaricom STK Push API credentials and environment",
                  href: "/admin/settings/daraja",
                },
                {
                  icon: ImageIcon,
                  title: "Image Processing",
                  description: "Background removal and product recommendation rules",
                  href: "/admin/settings/image-processing",
                },
              ].map(({ icon: Icon, title, description, href }) => (
                <button
                  key={href}
                  onClick={() => navigate(href)}
                  className="w-full flex items-center gap-4 p-4 bg-background border border-border rounded-none hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
