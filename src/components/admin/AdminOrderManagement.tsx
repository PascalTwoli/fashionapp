/**
 * Admin Order Management Component
 * Display and manage all orders for admin users
 */

import React, { useState } from "react";
import {
	ChevronDown,
	Search,
	Filter,
	Package,
	Clock,
	AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatKES } from "@/lib/format";
import { format } from "date-fns";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/OrderStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderWithCustomer {
	id: string;
	order_number: string;
	status: string;
	payment_status: string;
	payment_method: string;
	total_amount: number;
	customer_email: string;
	shipping_first_name: string;
	shipping_last_name: string;
	placed_at: string;
	updated_at: string;
}

export const AdminOrderManagement = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string | null>(null);
	const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | null>(
		null
	);
	const [selectedOrder, setSelectedOrder] = useState<OrderWithCustomer | null>(
		null
	);
	const [newStatus, setNewStatus] = useState<string>("");
	const [isUpdating, setIsUpdating] = useState(false);
	const [isMarkingPaid, setIsMarkingPaid] = useState(false);
	const [isConfirmingCOD, setIsConfirmingCOD] = useState(false);

	// Fetch all orders
	const { data: orders = [], isLoading, refetch } = useQuery({
		queryKey: ["admin-orders", searchQuery, statusFilter, paymentStatusFilter],
		queryFn: async () => {
			let query = supabase
				.from("orders")
				.select("*")
				.order("placed_at", { ascending: false });

			if (searchQuery) {
				query = query.or(
					`order_number.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,shipping_first_name.ilike.%${searchQuery}%,shipping_last_name.ilike.%${searchQuery}%`
				);
			}

			if (statusFilter) {
				query = query.eq("status", statusFilter);
			}

			if (paymentStatusFilter) {
				query = query.eq("payment_status", paymentStatusFilter);
			}

			const { data, error } = await query.limit(100);
			if (error) throw error;
			return data || [];
		},
	});

	// Update order status
	const handleUpdateStatus = async () => {
		if (!selectedOrder || !newStatus) return;

		setIsUpdating(true);
		try {
			const { error } = await supabase
				.from("orders")
				.update({ status: newStatus, updated_at: new Date().toISOString() })
				.eq("id", selectedOrder.id);

			if (error) throw error;

			// Create timeline entry
			await supabase.from("order_timeline").insert({
				order_id: selectedOrder.id,
				status: newStatus,
				note: `Status changed to ${newStatus}`,
				created_by: (await supabase.auth.getUser()).data.user?.id,
			});

			// Refetch orders
			await refetch();
			setSelectedOrder(null);
			setNewStatus("");
		} catch (error) {
			console.error("Error updating order:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	// Admin confirms a COD order: updates status + deducts inventory
	const handleConfirmCODOrder = async () => {
		if (!selectedOrder) return;
		setIsConfirmingCOD(true);
		try {
			const adminId = (await supabase.auth.getUser()).data.user?.id;

			// 1. Confirm the order (admin RLS allows this)
			const { error: orderErr } = await supabase
				.from("orders")
				.update({ status: "confirmed", updated_at: new Date().toISOString() })
				.eq("id", selectedOrder.id);
			if (orderErr) throw orderErr;

			// 2. Fetch order items and deduct inventory
			const { data: orderItems } = await supabase
				.from("order_items")
				.select("variant_id, quantity")
				.eq("order_id", selectedOrder.id);

			if (orderItems) {
				for (const item of orderItems) {
					if (!item.variant_id) continue;
					const { data: variant } = await supabase
						.from("product_variants")
						.select("stock_quantity")
						.eq("id", item.variant_id)
						.maybeSingle();
					if (variant) {
						await supabase
							.from("product_variants")
							.update({ stock_quantity: Math.max(0, variant.stock_quantity - item.quantity) })
							.eq("id", item.variant_id);
					}
				}
			}

			// 3. Timeline entry
			await supabase.from("order_timeline").insert({
				order_id: selectedOrder.id,
				status: "confirmed",
				note: "Order confirmed by admin. Stock reserved.",
				created_by: adminId,
			});

			await refetch();
			setSelectedOrder(null);
		} catch (err) {
			console.error("Error confirming COD order:", err);
		} finally {
			setIsConfirmingCOD(false);
		}
	};

	// Admin marks COD payment as collected
	const handleMarkCODPaid = async () => {
		if (!selectedOrder) return;
		setIsMarkingPaid(true);
		try {
			const adminId = (await supabase.auth.getUser()).data.user?.id;

			const { error } = await supabase
				.from("orders")
				.update({
					payment_status: "paid",
					updated_at: new Date().toISOString(),
				})
				.eq("id", selectedOrder.id);
			if (error) throw error;

			await supabase.from("order_timeline").insert({
				order_id: selectedOrder.id,
				status: "confirmed",
				note: "Cash on Delivery payment collected by admin.",
				created_by: adminId,
			});

			await refetch();
			setSelectedOrder(null);
		} catch (err) {
			console.error("Error marking COD as paid:", err);
		} finally {
			setIsMarkingPaid(false);
		}
	};

	const orderStatuses = [
		"pending",
		"confirmed",
		"processing",
		"shipped",
		"delivered",
		"cancelled",
	];
	const paymentStatuses = ["pending", "paid", "failed", "refunded"];

	const filteredOrders = orders;

	const pendingCount = orders.filter((o: any) => o.status === "pending").length;
	const processingCount = orders.filter(
		(o: any) => o.status === "processing"
	).length;
	const failedPaymentsCount = orders.filter(
		(o: any) => o.payment_status === "failed"
	).length;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="font-display text-2xl mb-2">Order Management</h1>
				<p className="text-sm text-muted-foreground">
					Manage all customer orders
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-4">
				<Card className="p-4 border-0 bg-blue-50">
					<div className="flex items-start justify-between">
						<div>
							<p className="text-xs text-muted-foreground">Pending</p>
							<p className="text-2xl font-bold text-blue-600 mt-1">
								{pendingCount}
							</p>
						</div>
						<Clock className="w-5 h-5 text-blue-400" />
					</div>
				</Card>
				<Card className="p-4 border-0 bg-purple-50">
					<div className="flex items-start justify-between">
						<div>
							<p className="text-xs text-muted-foreground">Processing</p>
							<p className="text-2xl font-bold text-purple-600 mt-1">
								{processingCount}
							</p>
						</div>
						<Package className="w-5 h-5 text-purple-400" />
					</div>
				</Card>
				<Card className="p-4 border-0 bg-red-50">
					<div className="flex items-start justify-between">
						<div>
							<p className="text-xs text-muted-foreground">Failed Payments</p>
							<p className="text-2xl font-bold text-red-600 mt-1">
								{failedPaymentsCount}
							</p>
						</div>
						<AlertCircle className="w-5 h-5 text-red-400" />
					</div>
				</Card>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-2">
				<div className="flex-1 relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Search orders..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10 rounded-none"
					/>
				</div>
				<Select value={statusFilter || ""} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-full sm:w-[180px] rounded-none">
						<SelectValue placeholder="Filter by status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">All Statuses</SelectItem>
						{orderStatuses.map((status) => (
							<SelectItem key={status} value={status}>
								{status.charAt(0).toUpperCase() + status.slice(1)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={paymentStatusFilter || ""}
					onValueChange={setPaymentStatusFilter}>
					<SelectTrigger className="w-full sm:w-[180px] rounded-none">
						<SelectValue placeholder="Filter by payment" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">All Payments</SelectItem>
						{paymentStatuses.map((status) => (
							<SelectItem key={status} value={status}>
								{status.charAt(0).toUpperCase() + status.slice(1)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Orders Table */}
			<div className="border border-border rounded-none overflow-hidden">
				{isLoading ? (
					<div className="divide-y divide-border">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="p-4">
								<Skeleton className="h-8 w-full" />
							</div>
						))}
					</div>
				) : filteredOrders.length === 0 ? (
					<div className="p-8 text-center">
						<p className="text-muted-foreground">No orders found</p>
					</div>
				) : (
					<div className="divide-y divide-border max-h-[600px] overflow-y-auto">
						{filteredOrders.map((order: OrderWithCustomer) => (
							<button
								key={order.id}
								onClick={() => setSelectedOrder(order)}
								className="w-full p-4 text-left hover:bg-secondary/50 transition">
								<div className="flex items-start justify-between gap-2 mb-2">
									<div className="flex-1 min-w-0">
										<p className="font-medium text-sm">
											{order.order_number}
										</p>
										<p className="text-xs text-muted-foreground">
											{order.shipping_first_name} {order.shipping_last_name}
										</p>
										<p className="text-xs text-muted-foreground">
											{order.customer_email}
										</p>
									</div>
									<div className="text-right">
										<p className="font-medium text-sm">
											{formatKES(order.total_amount)}
										</p>
										<p className="text-xs text-muted-foreground">
											{format(new Date(order.placed_at), "PPP")}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 flex-wrap">
									<OrderStatusBadge status={order.status} variant="secondary" />
									<PaymentStatusBadge
										status={order.payment_status}
										variant="secondary"
									/>
								</div>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Order Detail Modal */}
			{selectedOrder && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
					<Card className="w-full sm:w-96 border-0 rounded-t-none sm:rounded-none max-h-[90vh] overflow-y-auto">
						<div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
							<h2 className="font-display text-lg">
								{selectedOrder.order_number}
							</h2>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									setSelectedOrder(null);
									setNewStatus("");
								}}>
								✕
							</Button>
						</div>

						<div className="p-4 space-y-4">
							{/* Order info */}
							<div>
								<p className="text-eyebrow">Customer</p>
								<p className="text-sm mt-1">
									{selectedOrder.shipping_first_name}{" "}
									{selectedOrder.shipping_last_name}
								</p>
								<p className="text-xs text-muted-foreground">
									{selectedOrder.customer_email}
								</p>
							</div>

							{/* Status update */}
							<div>
								<p className="text-eyebrow mb-2">Update Status</p>
								<Select value={newStatus} onValueChange={setNewStatus}>
									<SelectTrigger className="rounded-none mb-2">
										<SelectValue
											placeholder={
												selectedOrder.status.charAt(0).toUpperCase() +
												selectedOrder.status.slice(1)
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{orderStatuses.map((status) => (
											<SelectItem key={status} value={status}>
												{status.charAt(0).toUpperCase() + status.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button
									onClick={handleUpdateStatus}
									disabled={!newStatus || isUpdating}
									className="w-full h-10 bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
									{isUpdating ? "Updating..." : "Update Status"}
								</Button>
							</div>

							{/* COD Step 1: Confirm Order (pending → confirmed, stock deducted) */}
							{selectedOrder.payment_method === "cash_on_delivery" &&
								selectedOrder.status === "pending" && (
								<div className="bg-blue-50 border border-blue-200 p-3 rounded-none space-y-2">
									<p className="text-xs font-medium text-blue-900">
										Cash on Delivery — awaiting confirmation
									</p>
									<p className="text-xs text-blue-700">
										Confirm only after verifying the customer. This will reserve stock.
									</p>
									<Button
										onClick={handleConfirmCODOrder}
										disabled={isConfirmingCOD}
										className="w-full h-9 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs uppercase tracking-wider">
										{isConfirmingCOD ? "Confirming..." : "Confirm Order"}
									</Button>
								</div>
							)}

							{/* COD Step 2: Mark as Paid (confirmed → payment collected) */}
							{selectedOrder.payment_method === "cash_on_delivery" &&
								selectedOrder.status === "confirmed" &&
								selectedOrder.payment_status === "pending" && (
								<div className="bg-amber-50 border border-amber-200 p-3 rounded-none space-y-2">
									<p className="text-xs font-medium text-amber-900">
										Cash on Delivery — payment pending
									</p>
									<p className="text-xs text-amber-700">
										Mark as paid once cash has been collected on delivery.
									</p>
									<Button
										onClick={handleMarkCODPaid}
										disabled={isMarkingPaid}
										className="w-full h-9 bg-green-700 hover:bg-green-800 text-white rounded-none text-xs uppercase tracking-wider">
										{isMarkingPaid ? "Updating..." : "Mark as Paid"}
									</Button>
								</div>
							)}

							{/* Current status */}
							<div>
								<p className="text-eyebrow mb-2">Current Status</p>
								<div className="flex gap-2">
									<OrderStatusBadge status={selectedOrder.status} />
									<PaymentStatusBadge
										status={selectedOrder.payment_status}
									/>
								</div>
							</div>

							{/* Order totals */}
							<div className="bg-secondary/50 p-3 rounded-none">
								<div className="flex justify-between text-sm mb-1">
									<span>Amount</span>
									<span className="font-medium">
										{formatKES(selectedOrder.total_amount)}
									</span>
								</div>
								<p className="text-xs text-muted-foreground">
									Placed: {format(new Date(selectedOrder.placed_at), "PPpp")}
								</p>
								<p className="text-xs text-muted-foreground">
									Updated: {format(new Date(selectedOrder.updated_at), "PPpp")}
								</p>
							</div>

							<Button
								variant="outline"
								onClick={() => {
									setSelectedOrder(null);
									setNewStatus("");
								}}
								className="w-full h-10 rounded-none text-xs uppercase tracking-wider">
								Close
							</Button>
						</div>
					</Card>
				</div>
			)}
		</div>
	);
};

export default AdminOrderManagement;
