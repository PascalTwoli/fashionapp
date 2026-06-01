import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Lock, Truck, Shield, Calendar, Smartphone } from "lucide-react";
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
import { useEnabledPaymentProviders } from "@/hooks/usePaymentConfig";
import { useShippingSettings, calculateShipping } from "@/hooks/useShippingSettings";
import { createOrder, getOrderPaymentStatus } from "@/services/orders/orderService";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/format";
import { Card } from "@/components/ui/card";
import type { PaymentMethodCode, InitiatePaymentResponse } from "@/types/payments";

type CheckoutStep = "cart-review" | "address" | "payment" | "confirmation";

interface AddressFormData {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	address: string;
	address2: string;
	city: string;
	county: string;
	postcode: string;
	country: string;
	deliveryInstructions: string;
}

interface PaymentFormData {
	method: PaymentMethodCode;
	mpesaPhone?: string;
	cardHolder?: string;
	cardNumber?: string;
	expiryDate?: string;
	cvv?: string;
}

const StepProgress = ({ current, total }: { current: number; total: number }) => (
	<div className="flex gap-2 items-center text-xs text-muted-foreground">
		{Array.from({ length: total }).map((_, i) => (
			<div key={i} className={`h-1 flex-1 ${i < current ? "bg-foreground" : "bg-border"}`} />
		))}
		<span className="ml-2">Step {current} of {total}</span>
	</div>
);

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 30; // 90 seconds

const Checkout = () => {
	const navigate = useNavigate();
	const { items, totalPrice, clearCart } = useCart();
	const { user } = useAuth();
	const { toast } = useToast();
	const { data: savedAddresses } = useUserAddresses();
	const { mutate: addAddress } = useAddAddress();
	const { data: savedPaymentMethods = [] } = useSavedPaymentMethods();
	const { data: enabledProviders = [], isLoading: providersLoading } = useEnabledPaymentProviders();
	const { data: shippingSettings } = useShippingSettings();

	const [step, setStep] = useState<CheckoutStep>("cart-review");
	const [isProcessing, setIsProcessing] = useState(false);
	const [processingMessage, setProcessingMessage] = useState("Processing...");
	const [orderNumber, setOrderNumber] = useState("");
	const [orderTotal, setOrderTotal] = useState(0);
	const [orderId, setOrderId] = useState("");
	const [mpesaTransactionCode, setMpesaTransactionCode] = useState("");
	const [paymentConfirmed, setPaymentConfirmed] = useState(false);
	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
	const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const [addressForm, setAddressForm] = useState<AddressFormData>({
		firstName: "",
		lastName: "",
		email: user?.email || "",
		phone: "",
		address: "",
		address2: "",
		city: "",
		county: "",
		postcode: "",
		country: "Kenya",
		deliveryInstructions: "",
	});

	const [paymentForm, setPaymentForm] = useState<PaymentFormData>({ method: "mpesa" });
	const [saveAddress, setSaveAddress] = useState(false);

	const shipping = shippingSettings
		? calculateShipping(totalPrice, shippingSettings)
		: totalPrice >= 10000 || totalPrice === 0 ? 0 : 500;
	const grandTotal = totalPrice + shipping;

	// Default payment method to first enabled provider when providers load
	useEffect(() => {
		if (enabledProviders.length > 0) {
			const codes = enabledProviders.map((p) => p.provider_code);
			if (!codes.includes(paymentForm.method)) {
				setPaymentForm((prev) => ({ ...prev, method: enabledProviders[0].provider_code }));
			}
		}
	}, [enabledProviders]);

	// Populate address form from saved address selection
	useEffect(() => {
		if (selectedAddressId && savedAddresses) {
			const selected = savedAddresses.find((a) => a.id === selectedAddressId);
			if (selected) {
				setAddressForm({
					firstName: selected.first_name,
					lastName:  selected.last_name,
					email:     (selected as any).email || addressForm.email,
					phone:     selected.phone,
					address:   selected.address,
					address2:  (selected as any).address_2 || "",
					city:      selected.city,
					county:    selected.county,
					postcode:  (selected as any).postcode  || "",
					country:   selected.country,
					deliveryInstructions: "",
				});
			}
		}
	}, [selectedAddressId, savedAddresses]);

	// Clean up polling on unmount
	useEffect(() => {
		return () => {
			if (pollingRef.current) clearInterval(pollingRef.current);
		};
	}, []);

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

	// ── Address step ─────────────────────────────────────────
	const handleAddressSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const missingFields: string[] = [];
		if (!addressForm.firstName) missingFields.push("First name");
		if (!addressForm.lastName)  missingFields.push("Last name");
		if (!addressForm.email)     missingFields.push("Email");
		if (!addressForm.phone)     missingFields.push("Phone number");
		if (!addressForm.address)   missingFields.push("Street address");
		if (!addressForm.city)      missingFields.push("Town / City");
		if (!addressForm.county)    missingFields.push("County / State");
		if (!addressForm.country)   missingFields.push("Country / Region");

		if (missingFields.length > 0) {
			toast({ title: "Missing information", description: `Please fill in: ${missingFields.join(", ")}`, variant: "destructive" });
			return;
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressForm.email)) {
			toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
			return;
		}

		if (addressForm.phone.replace(/\D/g, "").length < 10) {
			toast({ title: "Invalid phone", description: "Please enter a valid phone number (at least 10 digits)", variant: "destructive" });
			return;
		}

		// Pre-fill M-Pesa phone: saved default first, then address phone
		const defaultMethod = savedPaymentMethods.find((m) => m.is_default) ?? savedPaymentMethods[0];
		setPaymentForm((prev) => {
			if (defaultMethod?.type === "mpesa" && defaultMethod.phone) {
				return { ...prev, method: "mpesa", mpesaPhone: defaultMethod.phone };
			}
			return { ...prev, mpesaPhone: prev.mpesaPhone || addressForm.phone };
		});

		setStep("payment");
	};

	// ── M-Pesa payment polling ───────────────────────────────
	const startPolling = (oid: string, oNum: string, oTotal: number) => {
		let attempts = 0;

		pollingRef.current = setInterval(async () => {
			attempts++;
			const result = await getOrderPaymentStatus(oid);

			if (result?.payment_status === "paid") {
				clearInterval(pollingRef.current!);
				setMpesaTransactionCode(result.payment_reference ?? "");
				setOrderNumber(oNum);
				setOrderTotal(oTotal);
				setPaymentConfirmed(true);
				clearCart();
				setIsProcessing(false);
				setStep("confirmation");
			} else if (result?.payment_status === "failed") {
				clearInterval(pollingRef.current!);
				setIsProcessing(false);
				toast({
					title: "Payment declined",
					description: result.payment_error || "M-Pesa payment was not completed. Please try again.",
					variant: "destructive",
				});
			} else if (attempts >= POLL_MAX_ATTEMPTS) {
				clearInterval(pollingRef.current!);
				setIsProcessing(false);
				// Order exists but payment still pending — clear cart, show order history prompt
				clearCart();
				setOrderNumber(oNum);
				setOrderTotal(oTotal);
				setPaymentConfirmed(false);
				setStep("confirmation");
			}
		}, POLL_INTERVAL_MS);
	};

	// ── Payment step submit ──────────────────────────────────
	const handlePaymentSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!user?.id) {
			toast({ title: "Authentication error", description: "Please log in to continue.", variant: "destructive" });
			return;
		}

		if (paymentForm.method === "mpesa") {
			if (!paymentForm.mpesaPhone) {
				toast({ title: "M-Pesa phone required", description: "Please enter your M-Pesa phone number", variant: "destructive" });
				return;
			}
			if (paymentForm.mpesaPhone.replace(/\D/g, "").length < 10) {
				toast({ title: "Invalid M-Pesa phone", description: "Please enter a valid phone number (at least 10 digits)", variant: "destructive" });
				return;
			}
		} else if (paymentForm.method === "card") {
			const missing: string[] = [];
			if (!paymentForm.cardHolder) missing.push("Card holder name");
			if (!paymentForm.cardNumber) missing.push("Card number");
			if (!paymentForm.expiryDate) missing.push("Expiry date");
			if (!paymentForm.cvv) missing.push("CVV");
			if (missing.length > 0) {
				toast({ title: "Card details incomplete", description: `Please fill in: ${missing.join(", ")}`, variant: "destructive" });
				return;
			}
			if (paymentForm.cardNumber!.replace(/\D/g, "").length !== 16) {
				toast({ title: "Invalid card number", description: "Card number must be 16 digits", variant: "destructive" });
				return;
			}
			const cvvLen = paymentForm.cvv!.replace(/\D/g, "").length;
			if (cvvLen < 3 || cvvLen > 4) {
				toast({ title: "Invalid CVV", description: "CVV must be 3 or 4 digits", variant: "destructive" });
				return;
			}
			if (!/^\d{2}\/\d{2}$/.test(paymentForm.expiryDate!)) {
				toast({ title: "Invalid expiry date", description: "Expiry date must be in MM/YY format", variant: "destructive" });
				return;
			}
		}

		setIsProcessing(true);
		setProcessingMessage("Creating your order...");

		try {
			const result = await createOrder({
				user_id:             user.id,
				items,
				customer_email:      addressForm.email,
				customer_phone:      addressForm.phone,
				shipping_first_name: addressForm.firstName,
				shipping_last_name:  addressForm.lastName,
				shipping_address:    addressForm.address,
				shipping_address_2:  addressForm.address2 || undefined,
				shipping_city:       addressForm.city,
				shipping_county:     addressForm.county,
				shipping_postcode:   addressForm.postcode || undefined,
				shipping_country:    addressForm.country,
				payment_method:      paymentForm.method as "mpesa" | "card" | "cash_on_delivery",
				delivery_instructions: addressForm.deliveryInstructions,
				shipping_fee_override: shipping,
			});

			if (!result.success) {
				let msg = result.error || "Failed to create order";
				if (result.details?.errors && Array.isArray(result.details.errors)) {
					msg = "Stock availability changed:\n" + (result.details.errors as string[]).join("\n") + "\n\nPlease check your bag and try again.";
				}
				throw new Error(msg);
			}

			if (!result.order) throw new Error("Order created but no data returned.");

			const oId    = result.order.id;
			const oNum   = result.order.order_number;
			const oTotal = result.order.total_amount;

				// Save address if requested
			if (saveAddress && !selectedAddressId) {
				addAddress({
					first_name: addressForm.firstName,
					last_name:  addressForm.lastName,
					phone:      addressForm.phone,
					email:      addressForm.email    || undefined,
					address:    addressForm.address,
					address_2:  addressForm.address2 || undefined,
					city:       addressForm.city,
					county:     addressForm.county,
					postcode:   addressForm.postcode || undefined,
					country:    addressForm.country,
					is_default: false,
				} as any);
			}

			// ── Cash on Delivery ─────────────────────────────
			// Order is created in pending state. Admin confirms manually after
			// verifying the customer, and only then is stock deducted.
			if (paymentForm.method === "cash_on_delivery") {
				setOrderNumber(oNum);
				setOrderTotal(oTotal);
				setOrderId(oId);
				setPaymentConfirmed(true);
				clearCart();
				setIsProcessing(false);
				setStep("confirmation");
				return;
			}

			// ── M-Pesa STK Push ──────────────────────────────
			setProcessingMessage("Sending STK Push to your phone...");

			const { data: stkData, error: stkError } = await supabase.functions.invoke<InitiatePaymentResponse>(
				"initiate-payment",
				{
					body: {
						order_id: oId,
						phone:    paymentForm.mpesaPhone,
						amount:   oTotal,
					},
				}
			);

			if (stkError || !stkData?.success) {
				// STK initiation failed – leave order in pending, tell user
				const errMsg = (stkData as any)?.error ?? stkError?.message ?? "Could not initiate M-Pesa payment";
				throw new Error(errMsg);
			}

			// STK sent – keep spinner, start polling for callback
			setOrderId(oId);
			setOrderNumber(oNum);
			setOrderTotal(oTotal);
			setProcessingMessage("Check your phone and enter your M-Pesa PIN...");
			startPolling(oId, oNum, oTotal);

		} catch (error) {
			console.error("Checkout error:", error);
			toast({
				title: "Unable to complete order",
				description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
				variant: "destructive",
			});
			setIsProcessing(false);
			setProcessingMessage("Processing...");
		}
	};

	// ── Confirmation screen ──────────────────────────────────
	if (step === "confirmation") {
		return (
			<div className="min-h-screen bg-background pb-24">
				<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
					<div className="px-4 py-4 flex items-center justify-between">
						<h1 className="font-display text-lg">
							{paymentConfirmed ? "Order Confirmed" : "Order Placed"}
						</h1>
						<div className="w-10" />
					</div>
					<div className="px-4 pb-3">
						<StepProgress current={4} total={4} />
					</div>
				</header>

				<main className="px-4 pt-8 w-full">
					<div className="flex justify-center mb-8">
						<div className={`w-20 h-20 rounded-full flex items-center justify-center ${paymentConfirmed ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
							{paymentConfirmed ? <Check className="w-10 h-10" /> : <Loader2 className="w-10 h-10" />}
						</div>
					</div>

					<div className="text-center mb-8">
						{paymentConfirmed ? (
							<>
								<h2 className="font-display text-2xl mb-3">
									{paymentForm.method === "cash_on_delivery" ? "Order Placed!" : "Payment Confirmed!"}
								</h2>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{paymentForm.method === "cash_on_delivery"
										? "Your order has been received and is awaiting confirmation. We'll reach out to you shortly."
										: "Your M-Pesa payment was received. Your order is confirmed."}
								</p>
							</>
						) : (
							<>
								<h2 className="font-display text-2xl mb-3">Order Placed</h2>
								<p className="text-sm text-muted-foreground leading-relaxed">
									Your order was created but we haven't confirmed your payment yet.
									Please check your order history or contact support.
								</p>
							</>
						)}
					</div>

					<Card className="p-6 mb-6 border-0 bg-secondary/50">
						<div className="space-y-5">
							<div className="pb-4 border-b border-border">
								<p className="text-xs text-muted-foreground mb-1">Order Number</p>
								<p className="font-display text-lg">{orderNumber}</p>
							</div>

							{paymentForm.method === "mpesa" && mpesaTransactionCode && (
								<div className="pb-4 border-b border-border">
									<p className="text-xs text-muted-foreground mb-1">M-Pesa Receipt</p>
									<p className="font-mono text-sm font-medium">{mpesaTransactionCode}</p>
								</div>
							)}

							<div>
								<p className="text-xs text-muted-foreground mb-1.5">Payment Method</p>
								<p className="text-sm font-medium capitalize">
									{paymentForm.method === "cash_on_delivery"
										? "Cash on Delivery"
										: paymentForm.method === "mpesa"
										? "M-Pesa"
										: paymentForm.method}
								</p>
							</div>

							<div>
								<p className="text-xs text-muted-foreground mb-1.5">Payment Status</p>
								<p className="text-sm font-medium">
									{paymentForm.method === "cash_on_delivery"
										? "Due on delivery"
										: paymentConfirmed
										? "Paid"
										: "Pending confirmation"}
								</p>
							</div>

							{paymentConfirmed && (
								<div>
									<p className="text-xs text-muted-foreground mb-1.5">Estimated Delivery</p>
									<p className="text-sm font-medium">2–4 business days</p>
								</div>
							)}

							<div className="pt-4 border-t border-border">
								<p className="text-xs text-muted-foreground mb-1.5">Total Amount</p>
								<p className="font-display text-xl font-medium">{formatKES(orderTotal)}</p>
							</div>
						</div>
					</Card>

					{/* Delivery address */}
					<div className="bg-secondary/50 p-5 rounded-none mb-6 border border-border">
						<p className="text-xs text-muted-foreground mb-2.5">Delivering To</p>
						<div className="space-y-1">
							<p className="text-sm font-medium">{addressForm.firstName} {addressForm.lastName}</p>
							<p className="text-xs text-muted-foreground">{addressForm.address}</p>
							<p className="text-xs text-muted-foreground">{addressForm.city}, {addressForm.county}</p>
							<p className="text-xs text-muted-foreground mt-2">{addressForm.phone}</p>
						</div>
					</div>

					<div className="bg-blue-50 border border-blue-200 p-4 rounded-none mb-6">
						<p className="text-xs text-blue-900 leading-relaxed">
							A confirmation email has been sent to <strong>{addressForm.email}</strong>.
							Track your order progress in your account.
						</p>
					</div>

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

	// ── Cart review step ─────────────────────────────────────
	if (step === "cart-review") {
		return (
			<div className="min-h-screen bg-background pb-24">
				<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
					<div className="px-4 py-4 flex items-center justify-between">
						<Button variant="ghost" size="icon" onClick={() => navigate("/cart")}>
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
					<div className="mb-8">
						<h2 className="text-eyebrow mb-4">Items ({items.length})</h2>
						<div className="space-y-4">
							{items.map((item, idx) => (
								<div key={item.id}>
									<div className="flex gap-4">
										<div className="flex-shrink-0">
											<img src={item.image} alt={item.name} className="w-24 h-32 object-cover rounded-none" />
										</div>
										<div className="flex-1 flex flex-col justify-between">
											<div>
												<h3 className="text-sm font-medium leading-tight">{item.name}</h3>
												<p className="text-xs text-muted-foreground mt-1.5">
													{item.color}{item.size && ` / ${item.size}`}
												</p>
											</div>
											<div className="flex items-center justify-between">
												<p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
												<p className="font-medium text-sm">{formatKES(item.price * item.quantity)}</p>
											</div>
										</div>
									</div>
									{idx < items.length - 1 && <div className="border-b border-border mt-4" />}
								</div>
							))}
						</div>
					</div>

					<div className="bg-secondary/50 p-5 rounded-none mb-6 space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Subtotal</span>
							<span className="font-medium">{formatKES(totalPrice)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Delivery</span>
							<span className="font-medium">{shipping === 0 ? "Free" : formatKES(shipping)}</span>
						</div>
						<div className="pt-3 border-t border-border flex justify-between">
							<span className="text-sm font-medium">Total</span>
							<span className="text-lg font-medium">{formatKES(grandTotal)}</span>
						</div>
					</div>

					<div className="flex items-start gap-3 p-4 bg-background border border-border rounded-none mb-6">
						<Calendar className="w-5 h-5 flex-shrink-0 text-muted-foreground mt-0.5" />
						<div>
							<p className="text-sm font-medium">Estimated Delivery</p>
							<p className="text-xs text-muted-foreground mt-0.5">2–4 business days within Kenya</p>
						</div>
					</div>

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

					<Button
						onClick={() => setStep("address")}
						className="w-full h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider font-medium">
						Proceed to Checkout
					</Button>
				</main>
			</div>
		);
	}

	// ── Address step ─────────────────────────────────────────
	if (step === "address") {
		return (
			<div className="min-h-screen bg-background pb-24">
				<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
					<div className="px-4 py-4 flex items-center justify-between">
						<Button variant="ghost" size="icon" onClick={() => setStep("cart-review")}>
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
													firstName: "", lastName: "", email: user?.email || "",
													phone: "", address: "", address2: "", city: "", county: "", postcode: "", country: "Kenya", deliveryInstructions: "",
												});
											}}
											className="text-xs text-muted-foreground hover:text-foreground underline">
											Clear
										</button>
									)}
								</div>
								<Select value={selectedAddressId || ""} onValueChange={(v) => setSelectedAddressId(v || null)}>
									<SelectTrigger className="rounded-none h-11">
										<SelectValue placeholder="Select a saved address" />
									</SelectTrigger>
									<SelectContent>
										{savedAddresses.map((addr) => (
											<SelectItem key={addr.id} value={addr.id}>
												<div className="flex flex-col gap-1">
													<span className="font-medium">{addr.first_name} {addr.last_name}</span>
													<span className="text-xs text-muted-foreground">{addr.city}, {addr.county}</span>
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

						<div>
							<h3 className="text-eyebrow mb-4">{selectedAddressId ? "Shipping Address" : "Enter Address"}</h3>

							<div className="grid grid-cols-2 gap-3 mb-4">
								<div>
									<Label htmlFor="firstName" className="text-xs font-medium">First Name *</Label>
									<Input id="firstName" value={addressForm.firstName}
										onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
										className="mt-1.5 rounded-none text-sm h-10" placeholder="First name" />
								</div>
								<div>
									<Label htmlFor="lastName" className="text-xs font-medium">Last Name *</Label>
									<Input id="lastName" value={addressForm.lastName}
										onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
										className="mt-1.5 rounded-none text-sm h-10" placeholder="Last name" />
								</div>
							</div>

							<div className="mb-4">
								<Label htmlFor="email" className="text-xs font-medium">Email *</Label>
								<Input id="email" type="email" value={addressForm.email}
									onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
									className="mt-1.5 rounded-none text-sm h-10" placeholder="your@email.com" />
							</div>

							<div className="mb-4">
								<Label htmlFor="phone" className="text-xs font-medium">Phone Number *</Label>
								<Input id="phone" type="tel" value={addressForm.phone}
									onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
									className="mt-1.5 rounded-none text-sm h-10" placeholder="+254..." />
								<p className="text-xs text-muted-foreground mt-1">Include country code (e.g., +254722123456)</p>
							</div>

							{/* Street address — two fields side by side */}
							<div className="mb-4">
								<Label className="text-xs font-medium">Street Address *</Label>
								<div className="grid grid-cols-2 gap-2 mt-1.5">
									<Input value={addressForm.address}
										onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
										className="rounded-none text-sm h-10" placeholder="House number and street name" />
									<Input value={addressForm.address2}
										onChange={(e) => setAddressForm({ ...addressForm, address2: e.target.value })}
										className="rounded-none text-sm h-10" placeholder="Apartment, suite, unit, etc. (optional)" />
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3 mb-4">
								<div>
									<Label htmlFor="city" className="text-xs font-medium">Town / City *</Label>
									<Input id="city" value={addressForm.city}
										onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
										className="mt-1.5 rounded-none text-sm h-10" placeholder="Town or city" />
								</div>
								<div>
									<Label htmlFor="county" className="text-xs font-medium">County / State *</Label>
									<Input id="county" value={addressForm.county}
										onChange={(e) => setAddressForm({ ...addressForm, county: e.target.value })}
										className="mt-1.5 rounded-none text-sm h-10" placeholder="County or state" />
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3 mb-4">
								<div>
									<Label htmlFor="postcode" className="text-xs font-medium">Postcode / ZIP</Label>
									<Input id="postcode" value={addressForm.postcode}
										onChange={(e) => setAddressForm({ ...addressForm, postcode: e.target.value })}
										className="mt-1.5 rounded-none text-sm h-10" placeholder="e.g. 00100" />
								</div>
								<div>
									<Label htmlFor="country" className="text-xs font-medium">Country / Region *</Label>
									<Input id="country" value={addressForm.country}
										onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
										className="mt-1.5 rounded-none text-sm h-10" placeholder="Country" />
								</div>
							</div>

							<div className="mb-4">
								<Label htmlFor="deliveryInstructions" className="text-xs font-medium">Delivery Instructions (Optional)</Label>
								<Input id="deliveryInstructions" value={addressForm.deliveryInstructions}
									onChange={(e) => setAddressForm({ ...addressForm, deliveryInstructions: e.target.value })}
									className="mt-1.5 rounded-none text-sm h-10" placeholder="e.g., Leave at gate" />
								<p className="text-xs text-muted-foreground mt-1">Help the driver find your location</p>
							</div>
						</div>

						{!selectedAddressId && (
							<div className="flex items-center gap-2 pt-2 -mt-2">
								<input type="checkbox" id="saveAddress" checked={saveAddress}
									onChange={(e) => setSaveAddress(e.target.checked)}
									className="w-4 h-4 rounded border-border" />
								<Label htmlFor="saveAddress" className="text-xs cursor-pointer">Save this address for future orders</Label>
							</div>
						)}

						<div className="bg-secondary/50 p-5 rounded-none">
							<div className="flex justify-between items-center">
								<span className="text-sm font-medium">Order Total</span>
								<span className="text-lg font-medium">{formatKES(grandTotal)}</span>
							</div>
						</div>

						<Button type="submit" className="w-full h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider font-medium">
							Continue to Payment
						</Button>
					</form>
				</main>
			</div>
		);
	}

	// ── Payment step ─────────────────────────────────────────
	const mpesaMethods = savedPaymentMethods.filter((m) => m.type === "mpesa" && m.phone);
	const addressPhoneAlreadySaved = mpesaMethods.some((m) => m.phone === addressForm.phone);
	const mpesaQuickOptions = [
		...mpesaMethods.map((m) => ({ label: `${m.label} · ${m.phone}`, phone: m.phone! })),
		...(!addressPhoneAlreadySaved && addressForm.phone
			? [{ label: `Address phone · ${addressForm.phone}`, phone: addressForm.phone }]
			: []),
	];

	return (
		<div className="min-h-screen bg-background pb-24">
			<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
				<div className="px-4 py-4 flex items-center justify-between">
					<Button variant="ghost" size="icon" onClick={() => setStep("address")} disabled={isProcessing}>
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
				{/* Processing / waiting for STK overlay */}
				{isProcessing && (
					<div className="fixed inset-0 bg-background/95 z-50 flex flex-col items-center justify-center px-8 text-center">
						<div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center mb-6">
							{paymentForm.method === "mpesa"
								? <Smartphone className="w-8 h-8 text-foreground" />
								: <Loader2 className="w-8 h-8 animate-spin text-foreground" />}
						</div>
						<h2 className="font-display text-xl mb-3">{processingMessage}</h2>
						{paymentForm.method === "mpesa" && processingMessage.includes("PIN") && (
							<p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
								A payment prompt has been sent to <strong>{paymentForm.mpesaPhone}</strong>.
								Enter your M-Pesa PIN to complete the payment. This may take up to 90 seconds.
							</p>
						)}
					</div>
				)}

				<form onSubmit={handlePaymentSubmit} className="space-y-6">
					{/* Dynamic payment method list */}
					<div>
						<h3 className="text-eyebrow mb-4">Payment Method</h3>
						{providersLoading ? (
							<div className="py-8 text-center text-sm text-muted-foreground">Loading payment methods...</div>
						) : enabledProviders.length === 0 ? (
							<div className="py-8 text-center text-sm text-muted-foreground">
								No payment methods available. Please contact support.
							</div>
						) : (
							<div className="space-y-3">
								{enabledProviders.map((provider) => (
									<label
										key={provider.provider_code}
										className="flex items-start gap-3 p-4 border border-border rounded-none cursor-pointer hover:bg-secondary/50 transition-colors">
										<input
											type="radio"
											name="paymentMethod"
											value={provider.provider_code}
											checked={paymentForm.method === provider.provider_code}
											onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethodCode })}
											className="w-4 h-4 mt-1 cursor-pointer"
											disabled={isProcessing}
										/>
										<div>
											<p className="font-medium text-sm">{provider.provider_name}</p>
											<p className="text-xs text-muted-foreground">
												{provider.configuration?.description}
											</p>
										</div>
									</label>
								))}
							</div>
						)}
					</div>

					{/* M-Pesa form */}
					{paymentForm.method === "mpesa" && (
						<div className="space-y-4">
							<div className="bg-blue-50 border border-blue-200 p-4 rounded-none">
								<p className="text-xs text-blue-900 leading-relaxed">
									You will receive an STK Push on your phone. Enter your M-Pesa PIN to complete payment.
								</p>
							</div>

							{mpesaQuickOptions.length > 0 && (
								<div>
									<p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Quick select</p>
									<div className="flex flex-wrap gap-2">
										{mpesaQuickOptions.map((opt) => (
											<button
												key={opt.phone}
												type="button"
												onClick={() => setPaymentForm({ ...paymentForm, mpesaPhone: opt.phone })}
												disabled={isProcessing}
												className={`px-3 py-1.5 text-xs border transition-colors ${
													paymentForm.mpesaPhone === opt.phone
														? "border-foreground bg-foreground text-background"
														: "border-border hover:border-foreground/40"
												}`}>
												{opt.label}
											</button>
										))}
									</div>
								</div>
							)}

							<div>
								<Label htmlFor="mpesaPhone" className="text-xs font-medium">M-Pesa Phone Number *</Label>
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

					{/* Card form */}
					{paymentForm.method === "card" && (
						<div className="space-y-4">
							<div>
								<Label htmlFor="cardHolder" className="text-xs font-medium">Card Holder Name *</Label>
								<Input id="cardHolder" value={paymentForm.cardHolder || ""}
									onChange={(e) => setPaymentForm({ ...paymentForm, cardHolder: e.target.value })}
									placeholder="John Doe" className="mt-1.5 rounded-none text-sm h-10" disabled={isProcessing} />
							</div>
							<div>
								<Label htmlFor="cardNumber" className="text-xs font-medium">Card Number *</Label>
								<Input id="cardNumber" value={paymentForm.cardNumber || ""}
									onChange={(e) => {
										const val = e.target.value.replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
										setPaymentForm({ ...paymentForm, cardNumber: val.trim().replace(/\s/g, "") });
									}}
									placeholder="4242 4242 4242 4242" className="mt-1.5 rounded-none text-sm h-10"
									maxLength={19} disabled={isProcessing} />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<Label htmlFor="expiryDate" className="text-xs font-medium">Expiry *</Label>
									<Input id="expiryDate" value={paymentForm.expiryDate || ""}
										onChange={(e) => {
											let v = e.target.value.replace(/\D/g, "");
											if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2, 4);
											setPaymentForm({ ...paymentForm, expiryDate: v });
										}}
										placeholder="MM/YY" className="mt-1.5 rounded-none text-sm h-10"
										maxLength={5} disabled={isProcessing} />
								</div>
								<div>
									<Label htmlFor="cvv" className="text-xs font-medium">CVV *</Label>
									<Input id="cvv" type="password" value={paymentForm.cvv || ""}
										onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
										placeholder="123" className="mt-1.5 rounded-none text-sm h-10"
										maxLength={4} disabled={isProcessing} />
								</div>
							</div>
						</div>
					)}

					{/* Cash on Delivery info */}
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

					<Button
						type="submit"
						disabled={isProcessing || enabledProviders.length === 0}
						className="w-full h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider font-medium disabled:opacity-70">
						{isProcessing ? (
							<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{processingMessage}</>
						) : (
							`Pay ${formatKES(grandTotal)}`
						)}
					</Button>

					<div className="flex items-center justify-center gap-2 pt-2">
						<Lock className="w-4 h-4 text-muted-foreground" />
						<p className="text-xs text-center text-muted-foreground">Your payment is secure and encrypted</p>
					</div>
				</form>
			</main>
		</div>
	);
};

export default Checkout;
