/**
 * OrderHistory Page
 * Display user's order history with status and summary
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Package, Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/useOrders";
import { formatKES } from "@/lib/format";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/OrderStatusBadge";

export const OrderHistory = () => {
	const navigate = useNavigate();
	const { data: orders = [], isLoading } = useOrders();

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <Clock className="w-4 h-4" />;
			case "confirmed":
			case "processing":
				return <Package className="w-4 h-4" />;
			case "shipped":
				return <Truck className="w-4 h-4" />;
			case "delivered":
				return <CheckCircle2 className="w-4 h-4" />;
			default:
				return <Clock className="w-4 h-4" />;
		}
	};

	return (
		<div className="min-h-screen bg-background pb-24">
			{/* Header */}
			<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
				<div className="flex items-center justify-between p-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate(-1)}>
						<ArrowLeft className="w-5 h-5" />
					</Button>
					<h1 className="font-display text-lg">My Orders</h1>
					<div className="w-10" />
				</div>
			</header>

			{/* Content */}
			<main className="px-4 pt-6">
				{isLoading ? (
					<div className="space-y-4 w-full">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="border border-border rounded-none p-4">
								<Skeleton className="h-6 w-32 mb-3" />
								<Skeleton className="h-4 w-24 mb-2" />
								<Skeleton className="h-4 w-48" />
							</div>
						))}
					</div>
				) : orders.length === 0 ? (
					<div className="w-full py-12 text-center">
						<p className="text-muted-foreground mb-4">
							You haven't placed any orders yet
						</p>
						<Button
							onClick={() => navigate("/")}
							className="h-11 px-8 bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
							Start Shopping
						</Button>
					</div>
				) : (
					<div className="space-y-3 w-full">
						{orders.map((order: any) => (
							<button
								key={order.id}
								onClick={() => navigate(`/orders/${order.id}`)}
								className="w-full border border-border p-4 text-left hover:bg-secondary/50 transition rounded-none">
								{/* Header row */}
								<div className="flex items-start justify-between mb-3">
									<div className="flex-1">
										<p className="font-medium text-sm">
											Order {order.order_number}
										</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											{format(new Date(order.placed_at), "PPP")}
										</p>
									</div>
									<p className="font-medium text-sm">
										{formatKES(order.total_amount)}
									</p>
								</div>

								{/* Status badges */}
								<div className="flex items-center gap-2 flex-wrap">
									<div className="flex items-center gap-1">
										{getStatusIcon(order.status)}
										<OrderStatusBadge status={order.status} variant="secondary" />
									</div>
									<PaymentStatusBadge
										status={order.payment_status}
										variant="secondary"
									/>
								</div>

								{/* Arrow indicator */}
								<div className="text-muted-foreground mt-2 text-xs">
									View details →
								</div>
							</button>
						))}
					</div>
				)}
			</main>
		</div>
	);
};

export default OrderHistory;
