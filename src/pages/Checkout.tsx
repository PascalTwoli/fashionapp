/**
 * Checkout Component - Professional Premium UX
 * Complete checkout flow with improved UI, saved address autofill, and premium polish
 * Maintains FashionUp luxury minimal aesthetic throughout
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Lock, Truck, Shield, Calendar } from "lucide-react";
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
import { useSavedPaymentMethods } from "@/hooks/useSavedPaymentMethods";
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

// Step progress component
const StepProgress = ({ current, total }: { current: number; total: number }) => (
	<div className="flex gap-2 items-center text-xs text-muted-foreground">
		{Array.from({ length: total }).map((_, i) => (
			<div
				key={i}
				className={`h-1 flex-1 ${
					i < current ? "bg-foreground" : "bg-border"
				}`}
			/>
		))}
		<span className="ml-2">Step {current} of {total}</span>
	</div>
);

const Checkout = () => {
	const navigate = useNavigate();
	const { items, totalPrice, clearCart } = useCart();
	const { user } = useAuth();
	const { toast } = useToast();
	const { data: savedAddresses } = useUserAddresses();
	const { mutate: addAddress } = useAddAddress();
	const { data: savedPaymentMethods = [] } = useSavedPaymentMethods();

	const [step, setStep] = useState<CheckoutStep>("cart-review");
	const [isProcessing, setIsProcessing] = useState(false);
	const [processingMessage, setProcessingMessage] = useState("Processing...");
	const [orderNumber, setOrderNumber] = useState<string>("");
	const [orderTotal, setOrderTotal] = useState<number>(0);
	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

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

	// Calculate totals
	const shipping =
		totalPrice >= 10000 || totalPrice === 0 ? 0 : 500;
	const grandTotal = totalPrice + shipping;

	// ========== CRITICAL FIX: Handle saved address selection ==========
	// When user selects a saved address, POPULATE the form fields immediately
	useEffect(() => {
		if (selectedAddressId && savedAddresses) {
			const selected = savedAddresses.find((a) => a.id === selectedAddressId);
			if (selected) {
				// Populate all form fields with saved address data
				setAddressForm({
					firstName: selected.first_name,
					lastName: selected.last_name,
					email: addressForm.email, // Keep current email
					phone: selected.phone,
					address: selected.address,
					city: selected.city,
					county: selected.county,
					country: selected.country,
					deliveryInstructions: "", // Start fresh, user can add notes
				});
			}
		}
	}, [selectedAddressId, savedAddresses]);

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

		// Pre-fill payment: saved default method takes priority, then address phone
		const defaultMethod = savedPaymentMethods.find(m => m.is_default) ?? savedPaymentMethods[0];
		setPaymentForm(prev => {
			if (defaultMethod?.type === "mpesa" && defaultMethod.phone) {
				return { ...prev, method: "mpesa", mpesaPhone: defaultMethod.phone };
			}
			// Fall back to address phone if no saved method
			return { ...prev, mpesaPhone: prev.mpesaPhone || addressForm.phone };
		});

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
		setProcessingMessage(
			paymentForm.method === "mpesa" ? "Sending STK Push..." : "Processing payment..."
		);

		try {
			// The address form is already populated correctly (either manually or from saved address)
			const finalAddress = addressForm;

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
				if (
					result.details &&
					result.details.errors &&
					Array.isArray(result.details.errors)
				) {
					const inventoryErrors = result.details.errors as string[];
					errorMessage =
						"Stock availability changed:\n" +
						inventoryErrors.join("\n") +
						"\n\nPlease check your bag and try again.";
				}

				throw new Error(errorMessage);
			}

			if (!result.order) {
				throw new Error(
					"Order was created but no order data was returned. Please check your order history."
				);
			}

			// Save address if requested and not already saved
			if (saveAddress && !selectedAddressId) {
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
				throw new Error(
					"Order number not returned from server. Please check your order history."
				);
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
			setProcessingMessage("Processing...");
		}
	};

	// Simulate payment processing with better user experience
	const simulatePayment = async (method: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			const duration = method === "mpesa" ? 3000 : 2000;
			setTimeout(() => {
				// Randomly succeed 90% of the time for demo
				const success = Math.random() < 0.9;
				if (!success) {
					const methodName =
						method === "mpesa"
							? "M-Pesa"
							: method === "card"
								? "Card"
								: "Cash on Delivery";
					reject(
						new Error(
							`${methodName} payment declined. Please try again or use a different payment method.`
						)
					);
				} else {
					resolve();
				}
			}, duration);
		});
	};

	// Confirmation screen - IMPROVED
	if (step === "confirmation") {
		return (
			<div className="min-h-screen bg-background pb-24">
				{/* Header */}
				<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
					<div className="px-4 py-4 flex items-center justify-between">
						<h1 className="font-display text-lg">Order Confirmed</h1>
						<div className="w-10" />
					</div>
					<div className="px-4 pb-3">
						<StepProgress current={4} total={4} />
					</div>
				</header>

				<main className="px-4 pt-8 w-full">
					{/* Success animation */}
					<div className="flex justify-center mb-8">
						<div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
							<Check className="w-10 h-10" />
						</div>
					</div>

					{/* Success message */}
					<div className="text-center mb-8">
						<h2 className="font-display text-2xl mb-3">Order Confirmed!</h2>
						<p className="text-sm text-muted-foreground leading-relaxed">
							Thank you for your purchase. Your order has been placed successfully
							and you will receive a confirmation email shortly.
						</p>
					</div>

					{/* Order details card */}
					<Card className="p-6 mb-6 border-0 bg-secondary/50">
						<div className="space-y-5">
							<div className="pb-4 border-b border-border">
								<p className="text-xs text-muted-foreground mb-1">Order Number</p>
								<p className="font-display text-lg">{orderNumber}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground mb-1.5">
									Estimated Delivery
								</p>
								<p className="text-sm font-medium">
									2–4 business days
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground mb-1.5">
									Payment Method
								</p>
								<p className="text-sm font-medium capitalize">
									{paymentForm.method.replace(/_/g, " ")}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground mb-1.5">
									Total Amount
								</p>
								<p className="font-display text-xl font-medium">
									{formatKES(orderTotal)}
								</p>
							</div>
						</div>
					</Card>

					{/* Delivery address preview */}
					<div className="bg-secondary/50 p-5 rounded-none mb-6 border border-border">
						<p className="text-xs text-muted-foreground mb-2.5">Delivering To</p>
						<div className="space-y-1">
							<p className="text-sm font-medium">
								{addressForm.firstName} {addressForm.lastName}
							</p>
							<p className="text-xs text-muted-foreground">
								{addressForm.address}
							</p>
							<p className="text-xs text-muted-foreground">
								{addressForm.city}, {addressForm.county}
							</p>
							<p className="text-xs text-muted-foreground mt-2">
								{addressForm.phone}
							</p>
						</div>
					</div>

					{/* Info message */}
					<div className="bg-blue-50 border border-blue-200 p-4 rounded-none mb-6">
						<p className="text-xs text-blue-900 leading-relaxed">
							✓ A confirmation email has been sent to <strong>{addressForm.email}</strong>
							. You can track your order progress in your account.
						</p>
					</div>

					{/* Action buttons */}
					<div className="space-y-3">
						<Button
							onClick={() => navigate("/orders")}
							className="w-full h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider font-medium">
							Track Your Order
						</Button>
						<Button
							onClick={() => navigate("/")}
							variant="outline"
							className="w-full h-11 rounded-none text-xs uppercase tracking-wider font-medium">
							Continue Shopping
						</Button>
					</div>
				</main>
			</div>
		);
	}

	// Cart review step - IMPROVED UI
	if (step === "cart-review") {
		return (
			<div className="min-h-screen bg-background pb-24">
				{/* Header */}
				<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
					<div className="px-4 py-4 flex items-center justify-between">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigate("/cart")}>
							<ArrowLeft className="w-5 h-5" />
						</Button>
						<h1 className="font-display text-lg">Order Summary</h1>
						<div className="w-10" />
					</div>
					<div className="px-4 pb-3">
						<StepProgress current={1} total={4} />
					</div>
				</header>

				<main className="px-4 pt-6 w-full">
					{/* Items section - IMPROVED */}
					<div className="mb-8">
						<h2 className="text-eyebrow mb-4">Items ({items.length})</h2>
						<div className="space-y-4">
							{items.map((item, idx) => (
								<div key={item.id}>
									<div className="flex gap-4">
										{/* Product image - LARGER */}
										<div className="flex-shrink-0">
											<img
												src={item.image}
												alt={item.name}
												className="w-24 h-32 object-cover rounded-none"
											/>
										</div>
										{/* Product info */}
										<div className="flex-1 flex flex-col justify-between">
											<div>
												<h3 className="text-sm font-medium leading-tight">
													{item.name}
												</h3>
												<p className="text-xs text-muted-foreground mt-1.5">
													{item.color}{item.size && ` / ${item.size}`}
												</p>
											</div>
											{/* Qty and price */}
											<div className="flex items-center justify-between">
												<p className="text-xs text-muted-foreground">
													Qty: {item.quantity}
												</p>
												<p className="font-medium text-sm">
													{formatKES(item.price * item.quantity)}
												</p>
											</div>
										</div>
									</div>
									{/* Divider */}
									{idx < items.length - 1 && (
										<div className="border-b border-border mt-4" />
									)}
								</div>
							))}
						</div>
					</div>

					{/* Pricing section - IMPROVED */}
					<div className="bg-secondary/50 p-5 rounded-none mb-6 space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Subtotal</span>
							<span className="font-medium">{formatKES(totalPrice)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Delivery</span>
							<span className="font-medium">
								{shipping === 0 ? "Free" : formatKES(shipping)}
							</span>
						</div>
						<div className="pt-3 border-t border-border flex justify-between">
							<span className="text-sm font-medium">Total</span>
							<span className="text-lg font-medium">{formatKES(grandTotal)}</span>
						</div>
					</div>

					{/* Delivery estimate - NEW */}
					<div className="flex items-start gap-3 p-4 bg-background border border-border rounded-none mb-6">
						<Calendar className="w-5 h-5 flex-shrink-0 text-muted-foreground mt-0.5" />
						<div>
							<p className="text-sm font-medium">Estimated Delivery</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								2–4 business days within Kenya
							</p>
						</div>
					</div>

					{/* Trust indicators - NEW */}
					<div className="grid grid-cols-3 gap-3 mb-8">
						<div className="flex flex-col items-center text-center">
							<Lock className="w-5 h-5 mb-2 text-muted-foreground" />
							<p className="text-xs font-medium">Secure Checkout</p>
						</div>
						<div className="flex flex-col items-center text-center">
							<Shield className="w-5 h-5 mb-2 text-muted-foreground" />
							<p className="text-xs font-medium">Encrypted</p>
						</div>
						<div className="flex flex-col items-center text-center">
							<Truck className="w-5 h-5 mb-2 text-muted-foreground" />
							<p className="text-xs font-medium">Order Tracking</p>
						</div>
					</div>

					{/* CTA button - STICKY ON MOBILE */}
					<Button
						onClick={() => setStep("address")}
						className="w-full h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider font-medium">
						Proceed to Checkout
					</Button>
				</main>
			</div>
		);
	}

	// Address step - IMPROVED
	if (step === "address") {
		return (
			<div className="min-h-screen bg-background pb-24">
				{/* Header */}
				<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
					<div className="px-4 py-4 flex items-center justify-between">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setStep("cart-review")}>
							<ArrowLeft className="w-5 h-5" />
						</Button>
						<h1 className="font-display text-lg">Delivery Address</h1>
						<div className="w-10" />
					</div>
					<div className="px-4 pb-3">
						<StepProgress current={2} total={4} />
					</div>
				</header>

				<main className="px-4 pt-6 w-full">
					<form onSubmit={handleAddressSubmit} className="space-y-6">
						{/* Saved addresses - IMPROVED */}
						{savedAddresses && savedAddresses.length > 0 && (
							<div>
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-eyebrow">Saved Addresses</h3>
									{selectedAddressId && (
										<button
											type="button"
											onClick={() => {
												setSelectedAddressId(null);
												setAddressForm({
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
											}}
											className="text-xs text-muted-foreground hover:text-foreground underline">
											Clear
										</button>
									)}
								</div>
								<Select
									value={selectedAddressId || ""}
									onValueChange={(val) =>
										setSelectedAddressId(val || null)
									}>
									<SelectTrigger className="rounded-none h-11">
										<SelectValue placeholder="Select a saved address" />
									</SelectTrigger>
									<SelectContent>
										{savedAddresses.map((addr) => (
											<SelectItem key={addr.id} value={addr.id}>
												<div className="flex flex-col gap-1">
													<span className="font-medium">
														{addr.first_name} {addr.last_name}
													</span>
													<span className="text-xs text-muted-foreground">
														{addr.city}, {addr.county}
													</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{selectedAddressId && (
									<p className="text-xs text-muted-foreground mt-2">
										You can edit the fields below to modify this address for this order.
									</p>
								)}
							</div>
						)}

						{/* Address form sections */}
						<div>
							<h3 className="text-eyebrow mb-4">
								{selectedAddressId ? "Shipping Address" : "Enter Address"}
							</h3>

							{/* Name fields */}
							<div className="grid grid-cols-2 gap-3 mb-4">
								<div>
									<Label htmlFor="firstName" className="text-xs font-medium">
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
										className="mt-1.5 rounded-none text-sm h-10"
										placeholder="First name"
									/>
								</div>
								<div>
									<Label htmlFor="lastName" className="text-xs font-medium">
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
										className="mt-1.5 rounded-none text-sm h-10"
										placeholder="Last name"
									/>
								</div>
							</div>

							{/* Email */}
							<div className="mb-4">
								<Label htmlFor="email" className="text-xs font-medium">
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
									className="mt-1.5 rounded-none text-sm h-10"
									placeholder="your@email.com"
								/>
							</div>

							{/* Phone */}
							<div className="mb-4">
								<Label htmlFor="phone" className="text-xs font-medium">
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
									className="mt-1.5 rounded-none text-sm h-10"
									placeholder="+254..."
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Include country code (e.g., +254722123456)
								</p>
							</div>

							{/* Street address */}
							<div className="mb-4">
								<Label htmlFor="address" className="text-xs font-medium">
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
									className="mt-1.5 rounded-none text-sm h-10"
									placeholder="Street address"
								/>
							</div>

							{/* City & County */}
							<div className="grid grid-cols-2 gap-3 mb-4">
								<div>
									<Label htmlFor="city" className="text-xs font-medium">
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
										className="mt-1.5 rounded-none text-sm h-10"
										placeholder="City"
									/>
								</div>
								<div>
									<Label htmlFor="county" className="text-xs font-medium">
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
										className="mt-1.5 rounded-none text-sm h-10"
										placeholder="County"
									/>
								</div>
							</div>

							{/* Delivery instructions */}
							<div className="mb-4">
								<Label htmlFor="deliveryInstructions" className="text-xs font-medium">
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
									className="mt-1.5 rounded-none text-sm h-10"
									placeholder="e.g., Leave at gate"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Help the driver find your location
								</p>
							</div>
						</div>

						{/* Save address checkbox */}
						{!selectedAddressId && (
							<div className="flex items-center gap-2 pt-2 -mt-2">
								<input
									type="checkbox"
									id="saveAddress"
									checked={saveAddress}
									onChange={(e) => setSaveAddress(e.target.checked)}
									className="w-4 h-4 rounded border-border"
								/>
								<Label htmlFor="saveAddress" className="text-xs cursor-pointer">
									Save this address for future orders
								</Label>
							</div>
						)}

						{/* Order total */}
						<div className="bg-secondary/50 p-5 rounded-none">
							<div className="flex justify-between items-center">
								<span className="text-sm font-medium">Order Total</span>
								<span className="text-lg font-medium">
									{formatKES(grandTotal)}
								</span>
							</div>
						</div>

						{/* Submit button */}
						<Button
							type="submit"
							className="w-full h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider font-medium">
							Continue to Payment
						</Button>
					</form>
				</main>
			</div>
		);
	}

	// Payment step - IMPROVED
	return (
		<div className="min-h-screen bg-background pb-24">
			{/* Header */}
			<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
				<div className="px-4 py-4 flex items-center justify-between">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setStep("address")}
						disabled={isProcessing}>
						<ArrowLeft className="w-5 h-5" />
					</Button>
					<h1 className="font-display text-lg">Payment</h1>
					<div className="w-10" />
				</div>
				<div className="px-4 pb-3">
					<StepProgress current={3} total={4} />
				</div>
			</header>

			<main className="px-4 pt-6 w-full">
				<form onSubmit={handlePaymentSubmit} className="space-y-6">
					{/* Payment method section */}
					<div>
						<h3 className="text-eyebrow mb-4">Payment Method</h3>
						<div className="space-y-3">
							{/* M-Pesa */}
							<label className="flex items-start gap-3 p-4 border border-border rounded-none cursor-pointer hover:bg-secondary/50 transition-colors">
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
									className="w-4 h-4 mt-1 cursor-pointer"
									disabled={isProcessing}
								/>
								<div>
									<p className="font-medium text-sm">M-Pesa</p>
									<p className="text-xs text-muted-foreground">
										Pay via STK Push (Safaricom)
									</p>
								</div>
							</label>

							{/* Card */}
							<label className="flex items-start gap-3 p-4 border border-border rounded-none cursor-pointer hover:bg-secondary/50 transition-colors">
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
									className="w-4 h-4 mt-1 cursor-pointer"
									disabled={isProcessing}
								/>
								<div>
									<p className="font-medium text-sm">Card</p>
									<p className="text-xs text-muted-foreground">
										Visa, Mastercard, Amex
									</p>
								</div>
							</label>

							{/* Cash on Delivery */}
							<label className="flex items-start gap-3 p-4 border border-border rounded-none cursor-pointer hover:bg-secondary/50 transition-colors">
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
									className="w-4 h-4 mt-1 cursor-pointer"
									disabled={isProcessing}
								/>
								<div>
									<p className="font-medium text-sm">Cash on Delivery</p>
									<p className="text-xs text-muted-foreground">
										Pay when your order arrives
									</p>
								</div>
							</label>
						</div>
					</div>

					{/* M-Pesa form */}
					{paymentForm.method === "mpesa" && (
						<div className="space-y-4">
							<div className="bg-blue-50 border border-blue-200 p-4 rounded-none">
								<p className="text-xs text-blue-900 leading-relaxed">
									📱 You will receive an STK Push on your phone. Enter your M-Pesa PIN to complete payment.
								</p>
							</div>

							{/* Saved M-Pesa numbers as quick-select chips */}
							{(() => {
								const mpesaMethods = savedPaymentMethods.filter(m => m.type === "mpesa" && m.phone);
								// Include address phone if different from saved methods
								const addressPhone = addressForm.phone;
								const addressPhoneAlreadySaved = mpesaMethods.some(m => m.phone === addressPhone);
								const quickOptions = [
									...mpesaMethods.map(m => ({ label: `${m.label} · ${m.phone}`, phone: m.phone! })),
									...(!addressPhoneAlreadySaved && addressPhone ? [{ label: `Address phone · ${addressPhone}`, phone: addressPhone }] : []),
								];
								if (quickOptions.length === 0) return null;
								return (
									<div>
										<p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Quick select</p>
										<div className="flex flex-wrap gap-2">
											{quickOptions.map(opt => (
												<button
													key={opt.phone}
													type="button"
													onClick={() => setPaymentForm({ ...paymentForm, mpesaPhone: opt.phone })}
													className={`px-3 py-1.5 text-xs border transition-colors ${paymentForm.mpesaPhone === opt.phone ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"}`}
													disabled={isProcessing}
												>
													{opt.label}
												</button>
											))}
										</div>
									</div>
								);
							})()}

							<div>
								<Label htmlFor="mpesaPhone" className="text-xs font-medium">
									M-Pesa Phone Number *
								</Label>
								<Input
									id="mpesaPhone"
									type="tel"
									placeholder="+254 or 07..."
									value={paymentForm.mpesaPhone || ""}
									onChange={(e) => setPaymentForm({ ...paymentForm, mpesaPhone: e.target.value })}
									className="mt-1.5 rounded-none text-sm h-10"
									disabled={isProcessing}
								/>
								<p className="text-xs text-muted-foreground mt-1">You can also type a different number above.</p>
							</div>
						</div>
					)}

					{/* Card form - IMPROVED */}
					{paymentForm.method === "card" && (
						<div className="space-y-4">
							<div className="bg-amber-50 border border-amber-200 p-4 rounded-none">
								<p className="text-xs text-amber-900">
									<strong>Sandbox Mode:</strong> Use any test card details (e.g.,
									4242 4242 4242 4242).
								</p>
							</div>
							<div>
								<Label htmlFor="cardHolder" className="text-xs font-medium">
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
									className="mt-1.5 rounded-none text-sm h-10"
									disabled={isProcessing}
								/>
							</div>
							<div>
								<Label htmlFor="cardNumber" className="text-xs font-medium">
									Card Number *
								</Label>
								<Input
									id="cardNumber"
									value={paymentForm.cardNumber || ""}
									onChange={(e) => {
										let val = e.target.value.replace(/\s/g, "");
										// Format with spaces: 4242 4242 4242 4242
										val = val.replace(/(\d{4})(?=\d)/g, "$1 ");
										setPaymentForm({
											...paymentForm,
											cardNumber: val.trim().replace(/\s/g, ""),
										});
									}}
									placeholder="4242 4242 4242 4242"
									className="mt-1.5 rounded-none text-sm h-10"
									maxLength={19}
									disabled={isProcessing}
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<Label htmlFor="expiryDate" className="text-xs font-medium">
										Expiry *
									</Label>
									<Input
										id="expiryDate"
										value={paymentForm.expiryDate || ""}
										onChange={(e) => {
											let val = e.target.value.replace(/\D/g, "");
											if (val.length >= 2) {
												val = val.slice(0, 2) + "/" + val.slice(2, 4);
											}
											setPaymentForm({
												...paymentForm,
												expiryDate: val,
											});
										}}
										placeholder="MM/YY"
										className="mt-1.5 rounded-none text-sm h-10"
										maxLength={5}
										disabled={isProcessing}
									/>
								</div>
								<div>
									<Label htmlFor="cvv" className="text-xs font-medium">
										CVV *
									</Label>
									<Input
										id="cvv"
										type="password"
										value={paymentForm.cvv || ""}
										onChange={(e) =>
											setPaymentForm({
												...paymentForm,
												cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
											})
										}
										placeholder="123"
										className="mt-1.5 rounded-none text-sm h-10"
										maxLength={4}
										disabled={isProcessing}
									/>
								</div>
							</div>
						</div>
					)}

					{/* COD info - SIMPLIFIED */}
					{paymentForm.method === "cash_on_delivery" && (
						<div className="bg-secondary/50 p-5 rounded-none border border-border">
							<p className="text-sm font-medium mb-2">Payment on Delivery</p>
							<p className="text-xs text-muted-foreground leading-relaxed">
								You will pay {formatKES(grandTotal)} in cash when your order arrives.
								Our delivery partner will collect payment upon delivery.
							</p>
						</div>
					)}

					{/* Order summary */}
					<div className="bg-secondary/50 p-5 rounded-none space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Subtotal</span>
							<span>{formatKES(totalPrice)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Shipping</span>
							<span>{shipping === 0 ? "Free" : formatKES(shipping)}</span>
						</div>
						<div className="pt-3 border-t border-border flex justify-between">
							<span className="font-medium">Total</span>
							<span className="text-lg font-medium">{formatKES(grandTotal)}</span>
						</div>
					</div>

					{/* Submit button with processing state */}
					<Button
						type="submit"
						disabled={isProcessing}
						className="w-full h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider font-medium disabled:opacity-70">
						{isProcessing ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								{processingMessage}
							</>
						) : (
							`Pay ${formatKES(grandTotal)}`
						)}
					</Button>

					{/* Trust badge */}
					<div className="flex items-center justify-center gap-2 pt-2">
						<Lock className="w-4 h-4 text-muted-foreground" />
						<p className="text-xs text-center text-muted-foreground">
							Your payment is secure and encrypted
						</p>
					</div>
				</form>
			</main>
		</div>
	);
};

export default Checkout;
