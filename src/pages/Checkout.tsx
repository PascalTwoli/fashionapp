/**
 * Checkout Component (Refactored)
 * Complete checkout flow with address, payment, and confirmation
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserAddresses, useAddAddress } from "@/hooks/useUserAddresses";
import { createOrder } from "@/services/orders/orderService";
import { formatKES } from "@/lib/format";
import { Card } from "@/components/ui/card";

type CheckoutStep = "cart-review" | "address" | "payment" | "confirmation";

interface AddressFormData {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	address: string;
	city: string;
	county: string;
	country: string;
	deliveryInstructions: string;
}

interface PaymentFormData {
	method: "mpesa" | "card" | "cash_on_delivery";
	mpesaPhone?: string;
	cardHolder?: string;
	cardNumber?: string;
	expiryDate?: string;
	cvv?: string;
}

const Checkout = () => {
	const navigate = useNavigate();
	const { items, totalPrice, clearCart } = useCart();
	const { user } = useAuth();
	const { toast } = useToast();
	const { data: savedAddresses } = useUserAddresses();
	const { mutate: addAddress } = useAddAddress();

	const [step, setStep] = useState<CheckoutStep>("cart-review");
	const [isProcessing, setIsProcessing] = useState(false);
	const [orderNumber, setOrderNumber] = useState<string>("");
	const [orderTotal, setOrderTotal] = useState<number>(0);

	// Form states
	const [addressForm, setAddressForm] = useState<AddressFormData>({
		firstName: "",
		lastName: "",
		email: user?.email || "",
		phone: "",
		address: "",
		city: "",
		county: "",
		country: "Kenya",
		deliveryInstructions: "",
	});

	const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
		method: "mpesa",
	});

	const [saveAddress, setSaveAddress] = useState(false);
	const [useExistingAddress, setUseExistingAddress] = useState<string | null>(
		null
	);

	// Calculate totals
	const shipping =
		totalPrice >= 10000 || totalPrice === 0
			? 0
			: 500;
	const grandTotal = totalPrice + shipping;

	// Validation
	if (items.length === 0 && step !== "confirmation") {
		return (
			<div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center pb-24">
				<h1 className="font-display text-2xl">Your bag is empty</h1>
				<Button
					onClick={() => navigate("/")}
					className="mt-6 h-11 px-8 bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
					Continue shopping
				</Button>
			</div>
		);
	}

	// Handle address step
	const handleAddressSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validate required fields with specific messages
		const missingFields: string[] = [];
		
		if (!addressForm.firstName) missingFields.push("First name");
		if (!addressForm.lastName) missingFields.push("Last name");
		if (!addressForm.email) missingFields.push("Email");
		if (!addressForm.phone) missingFields.push("Phone number");
		if (!addressForm.address) missingFields.push("Street address");
		if (!addressForm.city) missingFields.push("City");
		if (!addressForm.county) missingFields.push("County");

		if (missingFields.length > 0) {
			toast({
				title: "Missing information",
				description: `Please fill in: ${missingFields.join(", ")}`,
				variant: "destructive",
			});
			return;
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(addressForm.email)) {
			toast({
				title: "Invalid email",
				description: "Please enter a valid email address",
				variant: "destructive",
			});
			return;
		}

		// Validate phone format (basic - at least 10 digits)
		const phoneDigits = addressForm.phone.replace(/\D/g, "");
		if (phoneDigits.length < 10) {
			toast({
				title: "Invalid phone",
				description: "Please enter a valid phone number (at least 10 digits)",
				variant: "destructive",
			});
			return;
		}

		setStep("payment");
	};

	// Handle payment step
	const handlePaymentSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!user?.id) {
			toast({
				title: "Authentication error",
				description: "Please log in to continue.",
				variant: "destructive",
			});
			return;
		}

		// Validate payment method specific fields
		if (paymentForm.method === "mpesa") {
			if (!paymentForm.mpesaPhone) {
				toast({
					title: "M-Pesa phone required",
					description: "Please enter your M-Pesa phone number",
					variant: "destructive",
				});
				return;
			}
			const mpesaDigits = paymentForm.mpesaPhone.replace(/\D/g, "");
			if (mpesaDigits.length < 10) {
				toast({
					title: "Invalid M-Pesa phone",
					description: "Please enter a valid phone number (at least 10 digits)",
					variant: "destructive",
				});
				return;
			}
		} else if (paymentForm.method === "card") {
			const missingCardFields: string[] = [];
			if (!paymentForm.cardHolder) missingCardFields.push("Card holder name");
			if (!paymentForm.cardNumber) missingCardFields.push("Card number");
			if (!paymentForm.expiryDate) missingCardFields.push("Expiry date");
			if (!paymentForm.cvv) missingCardFields.push("CVV");

			if (missingCardFields.length > 0) {
				toast({
					title: "Card details incomplete",
					description: `Please fill in: ${missingCardFields.join(", ")}`,
					variant: "destructive",
				});
				return;
			}

			// Validate card number (basic - 16 digits)
			const cardDigits = paymentForm.cardNumber.replace(/\D/g, "");
			if (cardDigits.length !== 16) {
				toast({
					title: "Invalid card number",
					description: "Card number must be 16 digits",
					variant: "destructive",
				});
				return;
			}

			// Validate CVV (3-4 digits)
			const cvvDigits = paymentForm.cvv.replace(/\D/g, "");
			if (cvvDigits.length < 3 || cvvDigits.length > 4) {
				toast({
					title: "Invalid CVV",
					description: "CVV must be 3 or 4 digits",
					variant: "destructive",
				});
				return;
			}

			// Validate expiry date format (MM/YY)
			if (!/^\d{2}\/\d{2}$/.test(paymentForm.expiryDate)) {
				toast({
					title: "Invalid expiry date",
					description: "Expiry date must be in MM/YY format",
					variant: "destructive",
				});
				return;
			}
		}

		setIsProcessing(true);

		try {
			// Get address data (from form or existing)
			let finalAddress = addressForm;
			if (useExistingAddress) {
				const existing = savedAddresses?.find((a) => a.id === useExistingAddress);
				if (existing) {
					finalAddress = {
						firstName: existing.first_name,
						lastName: existing.last_name,
						email: addressForm.email,
						phone: existing.phone,
						address: existing.address,
						city: existing.city,
						county: existing.county,
						country: existing.country,
						deliveryInstructions: addressForm.deliveryInstructions,
					};
				}
			}

			// Create order
			const result = await createOrder({
				user_id: user.id,
				items,
				customer_email: finalAddress.email,
				customer_phone: finalAddress.phone,
				shipping_first_name: finalAddress.firstName,
				shipping_last_name: finalAddress.lastName,
				shipping_address: finalAddress.address,
				shipping_city: finalAddress.city,
				shipping_county: finalAddress.county,
				shipping_country: finalAddress.country,
				payment_method: paymentForm.method,
				delivery_instructions: finalAddress.deliveryInstructions,
			});

			if (!result.success) {
				// Show detailed error if available
				let errorMessage = result.error || "Failed to create order";
				
				// If there are inventory errors in details, show them
				if (result.details && result.details.errors && Array.isArray(result.details.errors)) {
					const inventoryErrors = result.details.errors as string[];
					errorMessage = "Stock availability changed:\n" + inventoryErrors.join("\n") + "\n\nPlease check your bag and try again.";
				}

				throw new Error(errorMessage);
			}

			if (!result.order) {
				throw new Error("Order was created but no order data was returned. Please check your order history.");
			}

			// Save address if requested
			if (saveAddress && !useExistingAddress) {
				addAddress({
					first_name: finalAddress.firstName,
					last_name: finalAddress.lastName,
					phone: finalAddress.phone,
					address: finalAddress.address,
					city: finalAddress.city,
					county: finalAddress.county,
					country: finalAddress.country,
					is_default: false,
				} as any);
			}

			// Simulate payment processing with better error handling
			try {
				await simulatePayment(paymentForm.method);
			} catch (paymentError) {
				throw new Error(
					`Payment processing failed: ${paymentError instanceof Error ? paymentError.message : "Unknown error"}`
				);
			}

			// Success - extract values with validation
			const orderNum = result.order.order_number || "";
			const orderTot = result.order.total_amount || 0;

			if (!orderNum) {
				throw new Error("Order number not returned from server. Please check your order history.");
			}

			setOrderNumber(orderNum);
			setOrderTotal(orderTot);
			clearCart();
			setStep("confirmation");

			toast({
				title: "Order placed successfully!",
				description: `Order number: ${orderNum}`,
			});
		} catch (error) {
			console.error("Checkout error:", error);
			console.error("Error details:", error instanceof Error ? error.stack : error);
			toast({
				title: "Unable to complete order",
				description:
					error instanceof Error
						? error.message
						: "An unexpected error occurred. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsProcessing(false);
		}
	};

	// Simulate payment processing with detailed error handling
	const simulatePayment = async (method: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				// Randomly succeed 90% of the time for demo
				const success = Math.random() < 0.9;
				if (!success) {
					const methodName = 
						method === "mpesa" ? "M-Pesa" :
						method === "card" ? "Card" :
						"Cash on Delivery";
					reject(new Error(`${methodName} payment declined. Please try again or use a different payment method.`));
				} else {
					resolve();
				}
			}, 2000);
		});
	};

	// Confirmation screen
	if (step === "confirmation") {
		return (
			<div className="min-h-screen bg-background pb-24">
				<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
					<div className="flex items-center justify-between p-4">
						<h1 className="font-display text-lg">Order Confirmation</h1>
						<div className="w-10" />
					</div>
				</header>

				<main className="px-4 pt-8 max-w-lg mx-auto">
					{/* Success icon */}
					<div className="flex justify-center mb-6">
						<div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
							<Check className="w-8 h-8" />
						</div>
					</div>

					{/* Success message */}
					<div className="text-center mb-8">
						<h2 className="font-display text-2xl mb-2">Order Confirmed!</h2>
						<p className="text-sm text-muted-foreground">
							Thank you for your purchase. Your order has been placed
							successfully.
						</p>
					</div>

					{/* Order details card */}
					<Card className="p-6 mb-6 border-0 bg-secondary/50">
						<div className="space-y-4">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Order Number</span>
								<span className="font-medium">{orderNumber}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Total Amount</span>
								<span className="font-medium">{formatKES(orderTotal)}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Payment Method</span>
								<span className="font-medium capitalize">
									{paymentForm.method.replace(/_/g, " ")}
								</span>
							</div>
							<div className="pt-4 border-t border-border">
								<p className="text-xs text-muted-foreground">
									A confirmation email has been sent to your email address.
									You can track your order in your account.
								</p>
							</div>
						</div>
					</Card>

					{/* Action buttons */}
					<div className="space-y-3">
						<Button
							onClick={() => navigate("/orders")}
							className="w-full h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
							View My Orders
						</Button>
						<Button
							onClick={() => navigate("/")}
							variant="outline"
							className="w-full h-11 rounded-none text-xs uppercase tracking-wider">
							Continue Shopping
						</Button>
					</div>
				</main>
			</div>
		);
	}

	// Cart review step
	if (step === "cart-review") {
		return (
			<div className="min-h-screen bg-background pb-24">
				<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
					<div className="flex items-center justify-between p-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigate("/cart")}>
							<ArrowLeft className="w-5 h-5" />
						</Button>
						<h1 className="font-display text-lg">Order Summary</h1>
						<div className="w-10" />
					</div>
				</header>

				<main className="px-4 pt-6 max-w-lg mx-auto">
					{/* Items */}
					<div className="space-y-4 mb-8">
						<h2 className="text-eyebrow">Items ({items.length})</h2>
						{items.map((item) => (
							<div key={item.id} className="flex gap-3 border-b border-border pb-4">
								<img
									src={item.image}
									alt={item.name}
									className="w-16 h-20 object-cover"
								/>
								<div className="flex-1 min-w-0">
									<h3 className="text-sm font-medium line-clamp-1">
										{item.name}
									</h3>
									<p className="text-xs text-muted-foreground">
										{item.color} / {item.size}
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Qty: {item.quantity}
									</p>
									<p className="text-sm font-medium mt-2">
										{formatKES(item.price * item.quantity)}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Totals */}
					<div className="bg-secondary/50 p-4 rounded-none mb-6 space-y-3">
						<div className="flex justify-between text-sm">
							<span>Subtotal</span>
							<span>{formatKES(totalPrice)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span>Shipping</span>
							<span>{shipping === 0 ? "Free" : formatKES(shipping)}</span>
						</div>
						<div className="pt-3 border-t border-border flex justify-between font-medium">
							<span>Total</span>
							<span>{formatKES(grandTotal)}</span>
						</div>
					</div>

					{/* Continue button */}
					<Button
						onClick={() => setStep("address")}
						className="w-full h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
						Proceed to Checkout
					</Button>
				</main>
			</div>
		);
	}

	// Address step
	if (step === "address") {
		return (
			<div className="min-h-screen bg-background pb-24">
				<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
					<div className="flex items-center justify-between p-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setStep("cart-review")}>
							<ArrowLeft className="w-5 h-5" />
						</Button>
						<h1 className="font-display text-lg">Delivery Address</h1>
						<div className="w-10" />
					</div>
				</header>

				<main className="px-4 pt-6 max-w-lg mx-auto">
					{/* Use existing address option */}
					{savedAddresses && savedAddresses.length > 0 && (
						<div className="mb-6">
							<h3 className="text-eyebrow mb-3">Saved Addresses</h3>
							<Select
								value={useExistingAddress || ""}
								onValueChange={(val) =>
									setUseExistingAddress(val || null)
								}>
								<SelectTrigger className="rounded-none">
									<SelectValue placeholder="Select a saved address" />
								</SelectTrigger>
								<SelectContent>
									{savedAddresses.map((addr) => (
										<SelectItem key={addr.id} value={addr.id}>
											{addr.first_name} {addr.last_name} - {addr.address}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* Address form */}
					<form onSubmit={handleAddressSubmit} className="space-y-4">
						<h3 className="text-eyebrow">
							{useExistingAddress ? "Or enter new address" : "Shipping Address"}
						</h3>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label htmlFor="firstName" className="text-xs">
									First Name *
								</Label>
								<Input
									id="firstName"
									value={addressForm.firstName}
									onChange={(e) =>
										setAddressForm({
											...addressForm,
											firstName: e.target.value,
										})
									}
									className="mt-1.5 rounded-none text-sm"
									disabled={!!useExistingAddress}
								/>
							</div>
							<div>
								<Label htmlFor="lastName" className="text-xs">
									Last Name *
								</Label>
								<Input
									id="lastName"
									value={addressForm.lastName}
									onChange={(e) =>
										setAddressForm({
											...addressForm,
											lastName: e.target.value,
										})
									}
									className="mt-1.5 rounded-none text-sm"
									disabled={!!useExistingAddress}
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="email" className="text-xs">
								Email *
							</Label>
							<Input
								id="email"
								type="email"
								value={addressForm.email}
								onChange={(e) =>
									setAddressForm({
										...addressForm,
										email: e.target.value,
									})
								}
								className="mt-1.5 rounded-none text-sm"
							/>
						</div>

						<div>
							<Label htmlFor="phone" className="text-xs">
								Phone Number *
							</Label>
							<Input
								id="phone"
								type="tel"
								value={addressForm.phone}
								onChange={(e) =>
									setAddressForm({
										...addressForm,
										phone: e.target.value,
									})
								}
								placeholder="+254..."
								className="mt-1.5 rounded-none text-sm"
								disabled={!!useExistingAddress}
							/>
						</div>

						<div>
							<Label htmlFor="address" className="text-xs">
								Street Address *
							</Label>
							<Input
								id="address"
								value={addressForm.address}
								onChange={(e) =>
									setAddressForm({
										...addressForm,
										address: e.target.value,
									})
								}
								className="mt-1.5 rounded-none text-sm"
								disabled={!!useExistingAddress}
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label htmlFor="city" className="text-xs">
									City *
								</Label>
								<Input
									id="city"
									value={addressForm.city}
									onChange={(e) =>
										setAddressForm({
											...addressForm,
											city: e.target.value,
										})
									}
									className="mt-1.5 rounded-none text-sm"
									disabled={!!useExistingAddress}
								/>
							</div>
							<div>
								<Label htmlFor="county" className="text-xs">
									County *
								</Label>
								<Input
									id="county"
									value={addressForm.county}
									onChange={(e) =>
										setAddressForm({
											...addressForm,
											county: e.target.value,
										})
									}
									className="mt-1.5 rounded-none text-sm"
									disabled={!!useExistingAddress}
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="deliveryInstructions" className="text-xs">
								Delivery Instructions (Optional)
							</Label>
							<Input
								id="deliveryInstructions"
								value={addressForm.deliveryInstructions}
								onChange={(e) =>
									setAddressForm({
										...addressForm,
										deliveryInstructions: e.target.value,
									})
								}
								placeholder="e.g., Leave at gate"
								className="mt-1.5 rounded-none text-sm"
							/>
						</div>

						{/* Save address checkbox */}
						<div className="flex items-center gap-2 pt-2">
							<input
								type="checkbox"
								id="saveAddress"
								checked={saveAddress}
								onChange={(e) => setSaveAddress(e.target.checked)}
								className="w-4 h-4 rounded"
							/>
							<Label htmlFor="saveAddress" className="text-xs cursor-pointer">
								Save this address for future orders
							</Label>
						</div>

						{/* Totals reminder */}
						<div className="bg-secondary/50 p-4 rounded-none my-6">
							<div className="flex justify-between text-sm font-medium">
								<span>Order Total</span>
								<span>{formatKES(grandTotal)}</span>
							</div>
						</div>

						{/* Submit button */}
						<Button
							type="submit"
							className="w-full h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
							Continue to Payment
						</Button>
					</form>
				</main>
			</div>
		);
	}

	// Payment step
	return (
		<div className="min-h-screen bg-background pb-24">
			<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
				<div className="flex items-center justify-between p-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setStep("address")}>
						<ArrowLeft className="w-5 h-5" />
					</Button>
					<h1 className="font-display text-lg">Payment</h1>
					<div className="w-10" />
				</div>
			</header>

			<main className="px-4 pt-6 max-w-lg mx-auto">
				<form onSubmit={handlePaymentSubmit} className="space-y-6">
					{/* Payment method selection */}
					<div>
						<h3 className="text-eyebrow mb-4">Payment Method</h3>
						<div className="space-y-3">
							{/* M-Pesa */}
							<label className="flex items-start gap-3 p-4 border border-border rounded-none cursor-pointer hover:bg-secondary/50 transition">
								<input
									type="radio"
									name="paymentMethod"
									value="mpesa"
									checked={paymentForm.method === "mpesa"}
									onChange={(e) =>
										setPaymentForm({
											...paymentForm,
											method: e.target.value as any,
										})
									}
									className="w-4 h-4 mt-1"
								/>
								<div>
									<p className="font-medium text-sm">M-Pesa</p>
									<p className="text-xs text-muted-foreground">
										Pay via M-Pesa STK Push
									</p>
								</div>
							</label>

							{/* Card */}
							<label className="flex items-start gap-3 p-4 border border-border rounded-none cursor-pointer hover:bg-secondary/50 transition">
								<input
									type="radio"
									name="paymentMethod"
									value="card"
									checked={paymentForm.method === "card"}
									onChange={(e) =>
										setPaymentForm({
											...paymentForm,
											method: e.target.value as any,
										})
									}
									className="w-4 h-4 mt-1"
								/>
								<div>
									<p className="font-medium text-sm">Card</p>
									<p className="text-xs text-muted-foreground">
										Visa, Mastercard, Amex
									</p>
								</div>
							</label>

							{/* Cash on Delivery */}
							<label className="flex items-start gap-3 p-4 border border-border rounded-none cursor-pointer hover:bg-secondary/50 transition">
								<input
									type="radio"
									name="paymentMethod"
									value="cash_on_delivery"
									checked={paymentForm.method === "cash_on_delivery"}
									onChange={(e) =>
										setPaymentForm({
											...paymentForm,
											method: e.target.value as any,
										})
									}
									className="w-4 h-4 mt-1"
								/>
								<div>
									<p className="font-medium text-sm">Cash on Delivery</p>
									<p className="text-xs text-muted-foreground">
										Pay when you receive your order
									</p>
								</div>
							</label>
						</div>
					</div>

					{/* M-Pesa form */}
					{paymentForm.method === "mpesa" && (
						<div>
							<Label htmlFor="mpesaPhone" className="text-xs">
								M-Pesa Phone Number *
							</Label>
							<Input
								id="mpesaPhone"
								type="tel"
								placeholder="+254..."
								value={paymentForm.mpesaPhone || ""}
								onChange={(e) =>
									setPaymentForm({
										...paymentForm,
										mpesaPhone: e.target.value,
									})
								}
								className="mt-1.5 rounded-none text-sm"
							/>
							<p className="text-xs text-muted-foreground mt-2">
								You will receive an STK push. Enter your M-Pesa PIN to confirm payment.
							</p>
						</div>
					)}

					{/* Card form (sandbox only) */}
					{paymentForm.method === "card" && (
						<div className="space-y-4">
							<div className="bg-yellow-50 border border-yellow-200 p-3 rounded-none">
								<p className="text-xs text-yellow-800">
									<strong>Sandbox Mode:</strong> This is a simulated payment. Use any test card details.
								</p>
							</div>
							<div>
								<Label htmlFor="cardHolder" className="text-xs">
									Card Holder Name *
								</Label>
								<Input
									id="cardHolder"
									value={paymentForm.cardHolder || ""}
									onChange={(e) =>
										setPaymentForm({
											...paymentForm,
											cardHolder: e.target.value,
										})
									}
									placeholder="John Doe"
									className="mt-1.5 rounded-none text-sm"
								/>
							</div>
							<div>
								<Label htmlFor="cardNumber" className="text-xs">
									Card Number *
								</Label>
								<Input
									id="cardNumber"
									value={paymentForm.cardNumber || ""}
									onChange={(e) =>
										setPaymentForm({
											...paymentForm,
											cardNumber: e.target.value.replace(/\s/g, ""),
										})
									}
									placeholder="4242 4242 4242 4242"
									className="mt-1.5 rounded-none text-sm"
									maxLength={19}
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<Label htmlFor="expiryDate" className="text-xs">
										Expiry Date *
									</Label>
									<Input
										id="expiryDate"
										value={paymentForm.expiryDate || ""}
										onChange={(e) =>
											setPaymentForm({
												...paymentForm,
												expiryDate: e.target.value,
											})
										}
										placeholder="MM/YY"
										className="mt-1.5 rounded-none text-sm"
										maxLength={5}
									/>
								</div>
								<div>
									<Label htmlFor="cvv" className="text-xs">
										CVV *
									</Label>
									<Input
										id="cvv"
										type="password"
										value={paymentForm.cvv || ""}
										onChange={(e) =>
											setPaymentForm({
												...paymentForm,
												cvv: e.target.value,
											})
										}
										placeholder="123"
										className="mt-1.5 rounded-none text-sm"
										maxLength={4}
									/>
								</div>
							</div>
						</div>
					)}

					{/* Order summary */}
					<div className="bg-secondary/50 p-4 rounded-none space-y-3">
						<div className="flex justify-between text-sm">
							<span>Subtotal</span>
							<span>{formatKES(totalPrice)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span>Shipping</span>
							<span>{shipping === 0 ? "Free" : formatKES(shipping)}</span>
						</div>
						<div className="pt-3 border-t border-border flex justify-between font-medium">
							<span>Total</span>
							<span>{formatKES(grandTotal)}</span>
						</div>
					</div>

					{/* Submit button */}
					<Button
						type="submit"
						disabled={isProcessing}
						className="w-full h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
						{isProcessing ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Processing...
							</>
						) : (
							`Pay ${formatKES(grandTotal)}`
						)}
					</Button>

					<p className="text-xs text-center text-muted-foreground">
						Your payment is secure and encrypted
					</p>
				</form>
			</main>
		</div>
	);
};

export default Checkout;
