/**
 * OrderDetails Page
 * Display full order details with items, shipping, payment info, and timeline
 */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOrderDetails } from "@/hooks/useOrderDetails";
import { formatKES } from "@/lib/format";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/OrderStatusBadge";
import { OrderTimeline } from "@/components/OrderTimeline";

export const OrderDetails = () => {
	const { id: orderId } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: order, isLoading, error } = useOrderDetails(orderId || "");

	React.useEffect(() => {
		if (orderId) {
			console.log("OrderDetails mounted with orderId:", orderId);
		}
	}, [orderId]);

	React.useEffect(() => {
		if (error) {
			console.error("OrderDetails error:", error);
		}
	}, [error]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background pb-24">
				<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
					<div className="flex items-center justify-between p-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigate(-1)}>
							<ArrowLeft className="w-5 h-5" />
						</Button>
						<h1 className="font-display text-lg">Order Details</h1>
						<div className="w-10" />
					</div>
				</header>
				<main className="px-4 pt-6">
					<div className="space-y-4 max-w-lg mx-auto">
						{[...Array(5)].map((_, i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				</main>
			</div>
		);
	}

	if (!order) {
		return (
			<div className="min-h-screen bg-background pb-24 flex items-center justify-center">
				<div className="text-center">
					<p className="text-muted-foreground mb-4">Order not found</p>
					<Button
						onClick={() => navigate("/orders")}
						variant="outline"
						className="rounded-none">
						Back to Orders
					</Button>
				</div>
			</div>
		);
	}

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
					<h1 className="font-display text-lg">Order Details</h1>
					<div className="w-10" />
				</div>
			</header>

			{/* Content */}
			<main className="px-4 pt-6 max-w-lg mx-auto">
				{/* Order Number & Status */}
				<Card className="p-4 mb-6 border-0 bg-secondary/50">
					<div className="space-y-3">
						<div className="flex justify-between items-start">
							<div>
								<p className="text-eyebrow">Order Number</p>
								<p className="font-medium mt-1">{order.order_number}</p>
							</div>
							<div className="text-right">
								<p className="text-eyebrow">Placed</p>
								<p className="text-sm mt-1">
									{format(new Date(order.placed_at), "PPP")}
								</p>
							</div>
						</div>
						<div className="flex gap-2">
							<OrderStatusBadge status={order.status} />
							<PaymentStatusBadge status={order.payment_status} />
						</div>
					</div>
				</Card>

				{/* Order Items */}
				<div className="mb-6">
					<p className="text-eyebrow mb-3">Items ({order.order_items?.length || 0})</p>
					<div className="space-y-4">
						{order.order_items?.map((item: any) => (
							<div
								key={item.id}
								className="flex gap-3 pb-3 border-b border-border">
								<img
									src={item.product_image}
									alt={item.product_name}
									className="w-16 h-20 object-cover"
								/>
								<div className="flex-1 min-w-0">
									<h4 className="text-sm font-medium line-clamp-1">
										{item.product_name}
									</h4>
									<p className="text-xs text-muted-foreground">
										{item.color} / {item.size}
									</p>
									<div className="flex justify-between items-end mt-2">
										<p className="text-xs">Qty: {item.quantity}</p>
										<p className="font-medium text-sm">
											{formatKES(item.line_total)}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Shipping Address */}
				<div className="mb-6">
					<p className="text-eyebrow mb-3">Shipping Address</p>
					<Card className="p-4 border-0 bg-secondary/50">
						<div className="text-sm space-y-1">
							<p className="font-medium">
								{order.shipping_first_name} {order.shipping_last_name}
							</p>
							<p className="text-muted-foreground">
								{order.shipping_address}
							</p>
							<p className="text-muted-foreground">
								{order.shipping_city}, {order.shipping_county}
							</p>
							<p className="text-muted-foreground">{order.shipping_country}</p>
							<p className="text-muted-foreground">{order.customer_phone}</p>
							{order.delivery_instructions && (
								<div className="pt-2 border-t border-border mt-2">
									<p className="text-xs font-medium">Delivery Instructions:</p>
									<p className="text-xs text-muted-foreground">
										{order.delivery_instructions}
									</p>
								</div>
							)}
						</div>
					</Card>
				</div>

				{/* Payment Information */}
				<div className="mb-6">
					<p className="text-eyebrow mb-3">Payment</p>
					<Card className="p-4 border-0 bg-secondary/50">
						<div className="text-sm space-y-2">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Method</span>
								<span className="font-medium capitalize">
									{order.payment_method.replace(/_/g, " ")}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Status</span>
								<PaymentStatusBadge status={order.payment_status} />
							</div>
							{order.payment_reference && (
								<div className="flex justify-between text-xs">
									<span className="text-muted-foreground">Reference</span>
									<span>{order.payment_reference}</span>
								</div>
							)}
						</div>
					</Card>
				</div>

				{/* Order Summary */}
				<div className="mb-6">
					<p className="text-eyebrow mb-3">Order Summary</p>
					<Card className="p-4 border-0 bg-secondary/50 space-y-2">
						<div className="flex justify-between text-sm">
							<span>Subtotal</span>
							<span>{formatKES(order.subtotal)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span>Shipping</span>
							<span>
								{order.shipping_fee === 0
									? "Free"
									: formatKES(order.shipping_fee)}
							</span>
						</div>
						<div className="pt-2 border-t border-border flex justify-between font-medium">
							<span>Total</span>
							<span>{formatKES(order.total_amount)}</span>
						</div>
					</Card>
				</div>

				{/* Order Timeline */}
				{order.order_timeline && order.order_timeline.length > 0 && (
					<div className="mb-6">
						<p className="text-eyebrow mb-4">Order Timeline</p>
						<OrderTimeline
							entries={order.order_timeline}
							currentStatus={order.status}
						/>
					</div>
				)}

				{/* Actions */}
				<div className="space-y-3">
					<Button
						onClick={() => navigate("/orders")}
						variant="outline"
						className="w-full h-11 rounded-none text-xs uppercase tracking-wider">
						Back to Orders
					</Button>
					<Button
						onClick={() => navigate("/")}
						className="w-full h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
						Continue Shopping
					</Button>
				</div>
			</main>
		</div>
	);
};

export default OrderDetails;
