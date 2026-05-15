import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductForm from "./ProductForm";
import { supabase } from "@/integrations/supabase/client";

interface Product {
	id: string;
	name: string;
	description: string | null;
	price: number;
	discount_price: number | null;
	brand: string | null;
	image_url: string | null;
	images: string[] | null;
	category: string | null;
	gender: "men" | "women" | "unisex" | null;
	stock_quantity: number | null;
	sizes: string[] | null;
	colors: string[] | null;
	tags: string[] | null;
	status: "active" | "draft" | "archived" | null;
	is_featured: boolean | null;
	created_at: string;
	updated_at: string;
	variants?: Array<{
		id?: string;
		size: string;
		color: string;
		stock_quantity: number;
		sku?: string;
		price_override?: number;
	}>;
}

interface EditProductDrawerProps {
	isOpen: boolean;
	product: Product | null;
	onClose: () => void;
	onSubmit: (data: any, images?: File[]) => Promise<void>;
	isLoading?: boolean;
}

/**
 * Premium edit product drawer
 * - Right-side slide-over on desktop
 * - Full-screen on mobile
 * - Sticky header with product info
 * - Scrollable form content
 * - Sticky footer with actions
 * - Unsaved changes detection
 */
const EditProductDrawer: React.FC<EditProductDrawerProps> = ({
	isOpen,
	product,
	onClose,
	onSubmit,
	isLoading = false,
}) => {
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showConfirmClose, setShowConfirmClose] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [productWithVariants, setProductWithVariants] = useState<Product | null>(null);
	const [isLoadingVariants, setIsLoadingVariants] = useState(false);

	// Fetch variants when product changes
	useEffect(() => {
		if (!product) {
			setProductWithVariants(null);
			return;
		}

		const fetchVariants = async () => {
			setIsLoadingVariants(true);
			try {
				const { data: variants, error } = await supabase
					.from("product_variants")
					.select("*")
					.eq("product_id", product.id);

				if (error) throw error;

				// Map variants to only include fields that match the schema
				const mappedVariants = (variants || []).map((v: any) => ({
					size: v.size,
					color: v.color,
					stock_quantity: v.stock_quantity,
					...(v.sku && { sku: v.sku }),
					...(v.price_override && { price_override: v.price_override }),
				}));

				setProductWithVariants({
					...product,
					variants: mappedVariants,
				});
			} catch (err) {
				console.error("Error fetching variants:", err);
				setProductWithVariants(product);
			} finally {
				setIsLoadingVariants(false);
			}
		};

		fetchVariants();
	}, [product]);

	// Prevent body scroll when drawer is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	// Reset unsaved changes when drawer closes
	useEffect(() => {
		if (!isOpen) {
			setHasUnsavedChanges(false);
			setShowConfirmClose(false);
		}
	}, [isOpen]);

	const handleClose = () => {
		if (hasUnsavedChanges) {
			setShowConfirmClose(true);
		} else {
			onClose();
		}
	};

	const handleConfirmClose = () => {
		setHasUnsavedChanges(false);
		setShowConfirmClose(false);
		onClose();
	};

	const handleFormChange = () => {
		setHasUnsavedChanges(true);
	};

	const handleSubmit = async (data: any, images?: File[]) => {
		setIsSubmitting(true);
		try {
			await onSubmit(data, images);
			setHasUnsavedChanges(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen || !product) return null;

	const primaryImage = product.images?.[0] || product.image_url;
	const statusColor =
		product.status === "active"
			? "bg-green-100 text-green-700"
			: product.status === "draft"
				? "bg-neutral-100 text-neutral-700"
				: "bg-gray-100 text-gray-700";

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-black/50"
				onClick={handleClose}
				style={{ animation: "fadeIn 0.2s ease-out" }}
			/>

			{/* Drawer container */}
			<div
				className="fixed inset-0 z-50 w-full bg-background overflow-hidden flex flex-col shadow-2xl"
				style={{ animation: "slideInRight 0.3s ease-out" }}>
				{/* Sticky Header */}
				<div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
					<div className="px-6 py-4 flex items-start justify-between gap-4">
						<div className="flex items-start gap-3 min-w-0 flex-1">
							{primaryImage && (
								<img
									src={primaryImage}
									alt={product.name}
									className="w-12 h-16 object-cover rounded border border-border flex-shrink-0"
								/>
							)}
							<div className="min-w-0 flex-1">
								<h2 className="font-display text-lg truncate">
									{product.name}
								</h2>
								<span
									className={`inline-block px-2 py-1 rounded text-xs font-medium uppercase mt-1 ${statusColor}`}>
									{product.status || "active"}
								</span>
							</div>
						</div>
						<button
							onClick={handleClose}
							className="flex-shrink-0 p-1 rounded-lg hover:bg-secondary transition-colors"
							aria-label="Close drawer">
							<X className="w-6 h-6" />
						</button>
					</div>
				</div>

				{/* Scrollable form content */}
				<div className="flex-1 overflow-y-auto">
					<div className="px-6 py-6">
					{isLoadingVariants ? (
						<div className="text-center py-8 text-muted-foreground">
							Loading variant inventory...
						</div>
					) : (
						<ProductForm
							initialData={productWithVariants || undefined}
							onSubmit={handleSubmit}
							isLoading={isSubmitting || isLoading || isLoadingVariants}
							onChange={handleFormChange}
							isInDrawer={true}
						/>
					)}
				</div>
			</div>

			{/* Sticky Footer */}
			<div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4 flex items-center gap-3">
				{hasUnsavedChanges && !isLoadingVariants && (
					<div className="flex items-center gap-2 text-xs text-amber-600 mr-auto">
						<AlertCircle className="w-4 h-4 flex-shrink-0" />
						<span>Unsaved changes</span>
					</div>
				)}
				<Button
					variant="outline"
					onClick={handleClose}
					disabled={isSubmitting || isLoading || isLoadingVariants}
					className="flex-1 sm:flex-none">
					Cancel
				</Button>
				<Button
				type="button"
				onClick={(e) => {
					e.preventDefault();
					const formElement = document.getElementById("product-form") as HTMLFormElement;
					console.log("[EditProductDrawer] Save button clicked");
					console.log("[EditProductDrawer] Form element exists:", !!formElement);
					
					if (formElement) {
						console.log("[EditProductDrawer] Form found, triggering submit event...");
						// Dispatch the submit event - this will trigger the form's onSubmit handler
						const event = new Event("submit", { bubbles: true, cancelable: true });
						formElement.dispatchEvent(event);
						console.log("[EditProductDrawer] Form submit event dispatched");
					} else {
						console.error("[EditProductDrawer] ERROR: Form not found! ProductForm not rendering.");
					}
				}}
				disabled={isSubmitting || isLoading || isLoadingVariants}
					className="flex-1 sm:flex-none bg-foreground text-background">
					{isLoadingVariants ? "Loading..." : isSubmitting ? "Saving..." : "Save Changes"}
				</Button>
			</div>
		</div>

		{/* Unsaved changes confirmation modal */}
			{showConfirmClose && (
				<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/50"
						onClick={() => setShowConfirmClose(false)}
					/>
					<div
						className="relative bg-background rounded-lg sm:rounded-xl shadow-2xl max-w-sm w-full p-6"
						style={{ animation: "slideUp 0.3s ease-out" }}>
						<h3 className="font-display text-lg mb-2">
							Unsaved Changes
						</h3>
						<p className="text-sm text-muted-foreground mb-6">
							You have made changes to this product. Do you want to
							discard them?
						</p>
						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() => setShowConfirmClose(false)}
								className="flex-1">
								Continue Editing
							</Button>
							<Button
								variant="destructive"
								onClick={handleConfirmClose}
								className="flex-1">
								Discard Changes
							</Button>
						</div>
					</div>
				</div>
			)}

			<style>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}
				@keyframes slideInRight {
					from {
						transform: translateX(100%);
					}
					to {
						transform: translateX(0);
					}
				}
				@keyframes slideUp {
					from {
						opacity: 0;
						transform: translateY(2rem);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
			`}</style>
		</>
	);
};

export default EditProductDrawer;
