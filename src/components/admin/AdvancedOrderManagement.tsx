/**
 * Professional Admin Order Management Dashboard
 * Complete order operations interface
 */

import React, { useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Hooks
import {
  useAdminOrders,
  useAdminOrderDetail,
  useUpdateOrderStatus,
  useUpdatePaymentStatus,
  useAddOrderNote,
  useUpdateOrderNote,
  useDeleteOrderNote,
  useOrderAnalytics,
  useLowStockAlerts,
} from "@/hooks/useAdminOrders";

// Components
import { AnalyticsCards } from "./orders/AnalyticsCards";
import { LowStockAlerts } from "./orders/LowStockAlerts";
import { OrderSearchBar } from "./orders/OrderSearchBar";
import { OrderFilterPanel } from "./orders/OrderFilterPanel";
import { OrderTable } from "./orders/OrderTable";
import { OrderDetailsDrawer } from "./orders/OrderDetailsDrawer";

// Types
import { AdminOrder, OrderFilters, OrderStatusType } from "@/types/admin";

const AdminOrderManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<OrderFilters>({
    status: "all",
    payment_status: "all",
    payment_method: "all",
    sort: "newest",
    search: "",
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Mutations
  const updateOrderStatus = useUpdateOrderStatus();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const addOrderNote = useAddOrderNote();
  const updateOrderNote = useUpdateOrderNote();
  const deleteOrderNote = useDeleteOrderNote();

  // Queries
  const { data: ordersData, isLoading: isLoadingOrders } = useAdminOrders(
    filters,
    page,
    pageSize
  );
  const { data: selectedOrder, isLoading: isLoadingOrder } = useAdminOrderDetail(
    selectedOrderId || ""
  );
  const { data: analytics, isLoading: isLoadingAnalytics } = useOrderAnalytics();
  const { data: lowStockItems, isLoading: isLoadingStock } = useLowStockAlerts(5);

  // Handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setFilters((prev) => ({
      ...prev,
      search: term,
    }));
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: OrderFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setFilters({
      status: "all",
      payment_status: "all",
      payment_method: "all",
      sort: "newest",
      search: "",
    });
    setPage(1);
  }, []);

  const handleOrderSelect = useCallback((order: AdminOrder) => {
    setSelectedOrderId(order.id);
    setIsDrawerOpen(true);
  }, []);

  const handleStatusChange = useCallback(
    async (newStatus: OrderStatusType, note?: string) => {
      if (!selectedOrderId) return;
      await updateOrderStatus.mutateAsync({
        orderId: selectedOrderId,
        newStatus,
        note,
      });
    },
    [selectedOrderId, updateOrderStatus]
  );

  const handleAddNote = useCallback(
    async (note: string) => {
      if (!selectedOrderId) return;
      await addOrderNote.mutateAsync({
        orderId: selectedOrderId,
        note,
        isInternal: true,
      });
    },
    [selectedOrderId, addOrderNote]
  );

  const handleUpdateNote = useCallback(
    async (noteId: string, note: string) => {
      await updateOrderNote.mutateAsync({
        noteId,
        note,
      });
    },
    [updateOrderNote]
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      await deleteOrderNote.mutateAsync(noteId);
    },
    [deleteOrderNote]
  );

  const isUpdating =
    updateOrderStatus.isPending ||
    updatePaymentStatus.isPending ||
    addOrderNote.isPending ||
    updateOrderNote.isPending ||
    deleteOrderNote.isPending;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              className="h-10 w-10 rounded-none">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-lg">Order Management</h1>
              <p className="text-xs text-muted-foreground">Professional operations dashboard</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/admin")}
            variant="outline"
            className="rounded-none text-xs uppercase tracking-wider">
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Analytics Cards */}
        <section>
          <h2 className="text-sm font-medium mb-4 uppercase tracking-wider text-muted-foreground">
            Dashboard Metrics
          </h2>
          <AnalyticsCards analytics={analytics || null} isLoading={isLoadingAnalytics} />
        </section>

        {/* Alerts */}
        <section>
          <LowStockAlerts items={lowStockItems || []} isLoading={isLoadingStock} threshold={5} />
        </section>

        {/* Search & Filters */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OrderSearchBar
              value={searchTerm}
              onChange={handleSearch}
              onClear={() => handleSearch("")}
            />
          </div>
          <OrderFilterPanel
            filters={filters}
            onFiltersChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </section>

        {/* Orders Table */}
        <section>
          <h2 className="text-sm font-medium mb-4 uppercase tracking-wider text-muted-foreground">
            Orders ({ordersData?.count || 0})
          </h2>
          <OrderTable
            orders={ordersData?.data || []}
            isLoading={isLoadingOrders}
            onOrderSelect={handleOrderSelect}
            page={page}
            pageSize={pageSize}
            totalPages={ordersData?.totalPages || 1}
            onPageChange={setPage}
            totalCount={ordersData?.count || 0}
          />
        </section>
      </main>

      {/* Order Details Drawer */}
      <OrderDetailsDrawer
        order={selectedOrder || null}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setTimeout(() => setSelectedOrderId(null), 300);
        }}
        onStatusChange={handleStatusChange}
        onPaymentStatusChange={(status) => {
          if (selectedOrderId) {
            updatePaymentStatus.mutate({
              orderId: selectedOrderId,
              paymentStatus: status,
            });
          }
        }}
        onAddNote={handleAddNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default AdminOrderManagement;
