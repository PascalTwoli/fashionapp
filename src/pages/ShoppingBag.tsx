import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import BottomNavigation from "@/components/BottomNavigation";
import { useCart } from "@/contexts/CartContext";
import { useCartInventoryValidation } from "@/hooks/useCartInventoryValidation";
import { useToast } from "@/hooks/use-toast";
import { useScrollDetection } from "@/hooks/useScrollDetection";
import { useNavbarVisibility } from "@/hooks/useNavbarVisibility";
import { formatKES } from "@/lib/format";

const ShoppingBagPage = () => {
	const navigate = useNavigate();
	const { items, updateQuantity, removeFromCart, totalPrice, totalItems } =
		useCart();
	const { toast } = useToast();

	// Scroll detection and navbar visibility
	const scrollState = useScrollDetection();
	const { isNavbarVisible, handleScroll } = useNavbarVisibility();

	// Update navbar visibility based on scroll
	React.useEffect(() => {
		handleScroll(scrollState.scrollDirection);
	}, [scrollState.scrollDirection, handleScroll]);

	// Validate inventory on cart page load and when items change
	const { validation, isChecking } = useCartInventoryValidation(items);

	// Auto-remove out of stock items with notification
	React.useEffect(() => {
		if (validation.outOfStockItems.length > 0) {
			validation.outOfStockItems.forEach((item) => {
				removeFromCart(item.id);
			});
			toast({
				title: "Items removed",
				description: "Some items are no longer available and have been removed from your bag.",
				variant: "destructive",
			});
		}
	}, [validation.outOfStockItems.length]);

	// Auto-adjust quantities for low stock items
	React.useEffect(() => {
		validation.lowStockItems.forEach((item) => {
			if (item.quantity > item.available) {
				updateQuantity(item.id, item.available);
				toast({
					title: "Quantity adjusted",
					description: `${item.name}: Limited stock. Quantity adjusted to ${item.available}.`,
					variant: "default",
				});
			}
		});
	}, [validation.lowStockItems.length]);

	const shipping = totalPrice >= 10000 || totalPrice === 0 ? 0 : 500;
	const grandTotal = totalPrice + shipping;

	const canCheckout = items.length > 0 && validation.isValid && !isChecking;

	return (
		<div className="min-h-screen bg-background pb-40">
			<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
				<div className="flex items-center justify-between p-3">
					<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
						<ArrowLeft className="w-5 h-5" />
					</Button>
					<h1 className="font-display text-lg">Shopping Bag</h1>
					<span className="w-10 text-right text-xs text-muted-foreground">
						{totalItems} {totalItems === 1 ? "item" : "items"}
					</span>
				</div>
			</header>

			{/* Inventory validation alerts */}
			{isChecking && (
				<div className="px-4 pt-4">
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Checking inventory</AlertTitle>
						<AlertDescription>Verifying stock availability...</AlertDescription>
					</Alert>
				</div>
			)}

			{!isChecking && validation.errors.length > 0 && (
				<div className="px-4 pt-4 space-y-2">
					{validation.outOfStockItems.length > 0 && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Out of stock items removed</AlertTitle>
							<AlertDescription>
								{validation.outOfStockItems.map((item, idx) => (
									<div key={idx}>
										• {item.name} ({item.color}, Size {item.size})
									</div>
								))}
							</AlertDescription>
						</Alert>
					)}

					{validation.lowStockItems.length > 0 && (
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Limited stock - quantities adjusted</AlertTitle>
							<AlertDescription>
								{validation.lowStockItems.map((item, idx) => (
									<div key={idx}>
										• {item.name}: Now {item.available} available
									</div>
								))}
							</AlertDescription>
						</Alert>
					)}
				</div>
			)}

			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center text-center px-8 mt-32">
					<div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-5">
						<ShoppingBag
							className="w-7 h-7 text-muted-foreground"
							strokeWidth={1.5}
						/>
					</div>
					<h2 className="font-display text-xl">Your bag is empty</h2>
					<p className="text-sm text-muted-foreground mt-2 max-w-xs">
						Discover our latest arrivals and add your favorites to the
						bag.
					</p>
					<Button
						onClick={() => navigate("/")}
						className="mt-6 h-11 px-8 bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs uppercase tracking-wider">
						Continue shopping
					</Button>
				</div>
			) : (
				<>
					<ul className="divide-y divide-border">
						{items.map((item) => (
							<li
								key={`${item.id}-${item.size}-${item.color}`}
								className="flex gap-4 px-4 py-5">
								<button
									onClick={() =>
										navigate(`/product/${item.product_id}`)
									}
									className="shrink-0 w-24 h-32 bg-muted overflow-hidden">
									<img
										src={item.image}
										alt={item.name}
										className="w-full h-full object-cover"
									/>
								</button>

								<div className="flex-1 flex flex-col">
									<div className="flex justify-between items-start gap-2">
										<div>
											<h3 className="text-sm font-medium">
												{item.name}
											</h3>
											<p className="text-xs text-muted-foreground mt-0.5">
												Size {item.size} · {item.color}
											</p>
										</div>
										<button
											onClick={() => removeFromCart(item.id)}
											className="text-muted-foreground hover:text-destructive p-1"
											aria-label="Remove">
											<Trash2 className="w-4 h-4" />
										</button>
									</div>

									<div className="mt-auto flex items-center justify-between">
										<div className="flex items-center border border-border">
											<button
												onClick={() =>
													updateQuantity(
														item.id,
														item.quantity - 1,
													)
												}
												className="w-8 h-8 flex items-center justify-center hover:bg-secondary"
												aria-label="Decrease">
												<Minus className="w-3 h-3" />
											</button>
											<span className="w-8 text-center text-sm">
												{item.quantity}
											</span>
											<button
												onClick={() =>
													updateQuantity(
														item.id,
														item.quantity + 1,
													)
												}
												className="w-8 h-8 flex items-center justify-center hover:bg-secondary"
												aria-label="Increase">
												<Plus className="w-3 h-3" />
											</button>
										</div>
										<span className="text-sm font-semibold">
											{formatKES(item.price * item.quantity)}
										</span>
									</div>
								</div>
							</li>
						))}
					</ul>

					<section className="px-4 pt-6 pb-4 mt-2 bg-secondary mx-4">
						<h3 className="text-eyebrow mb-3">Order summary</h3>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Subtotal</span>
								<span>{formatKES(totalPrice)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Shipping</span>
								<span>
									{shipping === 0 ? "Free" : formatKES(shipping)}
								</span>
							</div>
							<div className="flex justify-between pt-3 mt-2 border-t border-border text-base font-semibold">
								<span>Total</span>
								<span>{formatKES(grandTotal)}</span>
							</div>
						</div>
					</section>

					{/* Sticky checkout */}
					<div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-background/95 backdrop-blur-md border-t border-border z-40 space-y-2">
						{!canCheckout && items.length > 0 && !isChecking && (
							<div className="text-xs text-center text-destructive">
								{validation.outOfStockItems.length > 0 && "Please remove out of stock items to continue"}
								{validation.lowStockItems.length > 0 && validation.outOfStockItems.length === 0 && "Stock quantities have been adjusted - please review"}
							</div>
						)}
						<Button
							onClick={() => navigate("/checkout")}
							disabled={!canCheckout}
							className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none text-sm tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed">
							{isChecking ? "Checking..." : `Checkout · ${formatKES(grandTotal)}`}
						</Button>
					</div>
				</>
			)}

			<BottomNavigation isVisible={isNavbarVisible} />
		</div>
	);
};

export default ShoppingBagPage;
