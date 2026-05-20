/**
 * Professional Order Details Drawer
 * Comprehensive order view with all details and actions
 */

import React, { useState } from "react";
import { X, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminOrder, OrderStatusType, ORDER_STATUS_FLOW } from "@/types/admin";
import { formatKES } from "@/lib/format";
import { format } from "date-fns";
import { OrderStatusBadge, PaymentStatusBadge, PaymentMethodBadge } from "./StatusBadges";
import { OrderTimeline } from "./OrderTimeline";
import { OrderNotes } from "./OrderNotes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface OrderDetailsDrawerProps {
  order: AdminOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (newStatus: OrderStatusType, note?: string) => Promise<void>;
  onPaymentStatusChange: (status: "paid" | "failed" | "refunded") => Promise<void>;
  onAddNote: (note: string) => Promise<void>;
  onUpdateNote: (noteId: string, note: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  isUpdating?: boolean;
}

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onPaymentStatusChange,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  isUpdating = false,
}) => {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatusType | "">("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  React.useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const availableStatuses = ORDER_STATUS_FLOW[order.status] || [];
  const items = order.order_items || [];
  const timeline = order.order_timeline || [];
  const notes = order.admin_order_notes || [];

  const subtotal = order.subtotal || 0;
  const shipping = order.shipping_fee || 0;
  const total = order.total_amount || 0;

  const handleStatusChange = async () => {
    if (!selectedStatus || selectedStatus === order.status) {
      toast({
        title: "No change",
        description: "Please select a different status",
        variant: "destructive",
      });
      return;
    }

    try {
      await onStatusChange(selectedStatus as OrderStatusType);
      setShowStatusDialog(false);
    } catch (err) {
      // Error already handled by the hook
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/10 z-40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l border-border z-50 overflow-y-auto transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}>
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg">Order {order.order_number}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-none">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-8">
          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-0 bg-secondary/50 p-4 rounded-none">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Order Status
              </p>
              <OrderStatusBadge status={order.status} className="mb-3" />
              <div className="space-y-2">
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as OrderStatusType)}>
                  <SelectTrigger className="h-9 rounded-none border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStatus && selectedStatus !== order.status && (
                  <Button
                    onClick={() => setShowStatusDialog(true)}
                    disabled={isUpdating}
                    size="sm"
                    className="w-full h-8 bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
                    Update Status
                  </Button>
                )}
              </div>
            </Card>

            <Card className="border-0 bg-secondary/50 p-4 rounded-none">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Payment Status
              </p>
              <PaymentStatusBadge status={order.payment_status} />
              <p className="text-xs text-muted-foreground mt-3">
                {order.payment_method && (
                  <>
                    <PaymentMethodBadge method={order.payment_method} />
                  </>
                )}
              </p>
              {order.payment_reference && (
                <p className="text-xs mt-2 font-mono text-muted-foreground">
                  Ref: {order.payment_reference}
                </p>
              )}
            </Card>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-medium mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Name
                </p>
                <p className="font-medium">
                  {order.shipping_first_name} {order.shipping_last_name}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Email
                </p>
                <p className="font-medium">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Phone
                </p>
                <p className="font-medium">{order.customer_phone}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Ordered
                </p>
                <p className="font-medium">{format(new Date(order.placed_at), "MMM d, yyyy")}</p>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div>
            <h3 className="text-sm font-medium mb-4">Shipping Address</h3>
            <div className="text-sm space-y-1 text-foreground">
              <p className="font-medium">
                {order.shipping_first_name} {order.shipping_last_name}
              </p>
              <p>{order.shipping_address}</p>
              <p>
                {order.shipping_city}, {order.shipping_county}
              </p>
              <p>{order.shipping_country}</p>
              {order.delivery_instructions && (
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="font-medium">Instructions:</span> {order.delivery_instructions}
                </p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-sm font-medium mb-4">Order Items</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 border border-border p-3 rounded-none">
                  {item.product_image && (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover border border-border"
                    />
                  )}
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && " • "}
                      {item.color && `Color: ${item.color}`}
                    </p>
                    <p className="text-xs mt-1">
                      {item.quantity}x {formatKES(item.unit_price)} ={" "}
                      <span className="font-medium">{formatKES(item.line_total)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-border pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatKES(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatKES(shipping)}</span>
              </div>
              <div className="flex justify-between font-medium border-t border-border pt-2 mt-2">
                <span>Total</span>
                <span className="text-lg">{formatKES(total)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-medium mb-4">Order Timeline</h3>
            <OrderTimeline timeline={timeline} />
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-medium mb-4">Admin Notes</h3>
            <OrderNotes
              notes={notes}
              orderId={order.id}
              onAddNote={onAddNote}
              onUpdateNote={onUpdateNote}
              onDeleteNote={onDeleteNote}
              isLoading={isUpdating}
            />
          </div>
        </div>
      </div>

      {/* Status Change Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the order status to{" "}
              <span className="font-medium">{selectedStatus}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={isUpdating}
              className="rounded-none bg-foreground text-background">
              Confirm
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
