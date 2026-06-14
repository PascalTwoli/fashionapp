import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductForm from "./ProductForm";

interface AddProductDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: any, images?: File[]) => Promise<void>;
	isLoading?: boolean;
}

/**
 * Premium add product drawer
 * - Full-screen overlay for creating new products
 * - Matches the style and behavior of EditProductDrawer
 * - Sticky header with title
 * - Scrollable form content
 * - Sticky footer with actions
 * - Unsaved changes detection
 */
const AddProductDrawer: React.FC<AddProductDrawerProps> = ({
	isOpen,
	onClose,
	onSubmit,
	isLoading = false,
}) => {
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showConfirmClose, setShowConfirmClose] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [bgRemovalProgress, setBgRemovalProgress] = useState<{
		message: string;
		current: number;
		total: number;
		completed?: boolean;
	} | null>(null);

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
			setBgRemovalProgress(null);
		}
	}, [isOpen]);

	// Listen for background removal progress events
	useEffect(() => {
		const handleProgress = (event: Event) => {
			const customEvent = event as CustomEvent;
			setBgRemovalProgress(customEvent.detail);
		};

		window.addEventListener('bgRemovalProgress', handleProgress);
		return () => {
			window.removeEventListener('bgRemovalProgress', handleProgress);
		};
	}, []);

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

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-[99] bg-black/50"
				onClick={handleClose}
				style={{ animation: "fadeIn 0.2s ease-out" }}
			/>

			{/* Drawer container */}
			<div
				className="fixed inset-0 z-[100] bg-background overflow-hidden flex flex-col shadow-2xl"
				style={{ animation: "slideInRight 0.3s ease-out" }}>
				{/* Sticky Header */}
				<div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
					<div className="px-6 py-4 flex items-start justify-between gap-4">
						<div className="flex items-start gap-3 min-w-0 flex-1">
							<div className="min-w-0 flex-1">
								<h2 className="font-display text-lg">
									Create New Product
								</h2>
								<p className="text-xs text-muted-foreground mt-1">
									Add a new product to your catalog
								</p>
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
						{bgRemovalProgress && (
							<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
								<div className="flex items-center gap-2 mb-2">
									<div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
									<p className="font-medium text-blue-900">Processing Background Removal</p>
								</div>
								<p className="text-sm text-blue-700 mb-3">{bgRemovalProgress.message}</p>
								<div className="w-full bg-blue-200 rounded-full h-2">
									<div 
										className="bg-blue-500 h-2 rounded-full transition-all"
										style={{ width: `${(bgRemovalProgress.current / bgRemovalProgress.total) * 100}%` }}
									></div>
								</div>
								<p className="text-xs text-blue-600 mt-2">
									{bgRemovalProgress.current} of {bgRemovalProgress.total} images
								</p>
							</div>
						)}
						<ProductForm
							onSubmit={handleSubmit}
							isLoading={isSubmitting || isLoading}
							onChange={handleFormChange}
							isInDrawer={true}
						/>
					</div>
				</div>

				{/* Sticky Footer */}
				<div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4 flex items-center gap-3">
					{hasUnsavedChanges && !isSubmitting && (
						<div className="flex items-center gap-2 text-xs text-amber-600 mr-auto">
							<AlertCircle className="w-4 h-4 flex-shrink-0" />
							<span>Unsaved changes</span>
						</div>
					)}
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={isSubmitting || isLoading}
						className="flex-1 sm:flex-none">
						Cancel
					</Button>
					<Button
						type="button"
						onClick={(e) => {
							e.preventDefault();
							const formElement = document.getElementById("product-form") as HTMLFormElement;
							console.log("[AddProductDrawer] Save button clicked");
							console.log("[AddProductDrawer] Form element exists:", !!formElement);
							
							if (formElement) {
								console.log("[AddProductDrawer] Form found, triggering submit event...");
								// Dispatch the submit event - this will trigger the form's onSubmit handler
								const event = new Event("submit", { bubbles: true, cancelable: true });
								formElement.dispatchEvent(event);
								console.log("[AddProductDrawer] Form submit event dispatched");
							} else {
								console.error("[AddProductDrawer] ERROR: Form not found! ProductForm not rendering.");
							}
						}}
						disabled={isSubmitting || isLoading}
						className="flex-1 sm:flex-none bg-foreground text-background">
						{isSubmitting ? "Creating..." : "Create Product"}
					</Button>
				</div>
			</div>

			{/* Unsaved changes confirmation modal */}
			{showConfirmClose && (
				<div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/50"
						onClick={() => setShowConfirmClose(false)}
					/>
					<div
						className="relative bg-background rounded-lg sm:rounded-xl shadow-2xl max-w-sm w-full p-6"
						style={{ animation: "slideUp 0.3s ease-out" }}>
						<h3 className="font-display text-lg mb-2">
							Discard New Product?
						</h3>
						<p className="text-sm text-muted-foreground mb-6">
							You have unsaved changes. Do you want to discard this new product?
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
								Discard
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

export default AddProductDrawer;
