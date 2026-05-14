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
