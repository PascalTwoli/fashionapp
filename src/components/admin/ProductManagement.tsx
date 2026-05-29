import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
} from "@/components/ui/card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Search, X as XIcon, Image as ImageIcon, AlertCircle, Package, CheckCircle2, FileText, Archive, Zap, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLowStockAlerts } from "@/hooks/useAdminOrders";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatKES } from "@/lib/format";
import { removeBackground, downloadProcessedImage, isRemoveBgCreditsLow, getRemoveBgCredits } from "@/lib/backgroundRemoval";
import ProductForm from "./ProductForm";
import EditProductDrawer from "./EditProductDrawer";
import ImageViewer from "../ImageViewer";
import { uploadProductImages } from "@/lib/uploadProductImages";

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
	white_background_indices?: number[] | null;
	has_white_background?: boolean | null;
	created_at: string;
	updated_at: string;
}

const ProductManagement = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [products, setProducts] = useState<Product[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Search and filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [filterCategory, setFilterCategory] = useState<string>("");
	const [filterStatus, setFilterStatus] = useState<string>("");
	const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price-low" | "price-high" | "alphabetical">("newest");
	const [productVariants, setProductVariants] = useState<Record<string, any[]>>({});
	const [imageViewerOpen, setImageViewerOpen] = useState(false);
	const [imageViewerProduct, setImageViewerProduct] = useState<Product | null>(null);
	const [productToDelete, setProductToDelete] = useState<Product | null>(null);
	const [showStockSheet, setShowStockSheet] = useState(false);

	const { data: variantAlerts, isLoading: isLoadingAlerts } = useLowStockAlerts(5);

	const categories = useMemo(
		() => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
		[products],
	);

	// Filter and search products
	const filteredProducts = useMemo(() => {
		let result = products;

		// Search
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(p) =>
					p.name.toLowerCase().includes(q) ||
					p.brand?.toLowerCase().includes(q) ||
					p.category?.toLowerCase().includes(q),
			);
		}

		// Category filter
		if (filterCategory) {
			result = result.filter((p) => p.category === filterCategory);
		}

		// Status filter
		if (filterStatus) {
			result = result.filter((p) => p.status === filterStatus);
		}

		// Sorting
		result.sort((a, b) => {
			switch (sortBy) {
				case "newest":
					return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
				case "oldest":
					return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
				case "price-low":
					return (a.discount_price || a.price) - (b.discount_price || b.price);
				case "price-high":
					return (b.discount_price || b.price) - (a.discount_price || a.price);
				case "alphabetical":
					return a.name.localeCompare(b.name);
				default:
					return 0;
			}
		});

		return result;
	}, [products, searchQuery, filterCategory, filterStatus, sortBy]);

	const productStats = useMemo(() => ({
		total: products.length,
		active: products.filter(p => p.status === "active").length,
		draft: products.filter(p => p.status === "draft").length,
		archived: products.filter(p => p.status === "archived").length,
		outOfStock: (variantAlerts || []).filter(v => v.stock_quantity === 0).length,
		lowStock: (variantAlerts || []).filter(v => v.stock_quantity > 0 && v.stock_quantity <= 5).length,
	}), [products, variantAlerts]);

	useEffect(() => {
		fetchProducts();
	}, []);

	const fetchProducts = async () => {
		try {
			console.log("[fetchProducts] Starting fetch from Supabase...");
			const { data, error } = await supabase
				.from("products")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;

			console.log(
				`[fetchProducts] Fetched ${(data || []).length} products from database`,
			);
			
			// Log white_background_indices for first few products
			(data || []).slice(0, 3).forEach((product: any) => {
				console.log(`[fetchProducts] Product "${product.name}": white_background_indices = ${JSON.stringify(product.white_background_indices)}, has_white_background = ${product.has_white_background}`);
			});

			setProducts((data || []) as Product[]);

			// Fetch variants for all products to calculate accurate stock
			if (data && data.length > 0) {
				const { data: variants } = await supabase
					.from("product_variants")
					.select("*")
					.in("product_id", data.map((p: any) => p.id));

				if (variants) {
					const variantsByProduct: Record<string, any[]> = {};
					variants.forEach((v: any) => {
						if (!variantsByProduct[v.product_id]) {
							variantsByProduct[v.product_id] = [];
						}
						variantsByProduct[v.product_id].push(v);
					});
					setProductVariants(variantsByProduct);
				}
			}

			// Invalidate React Query cache to sync with storefronts
			console.log(
				"[fetchProducts] Invalidating React Query cache for 'products'",
			);
			await queryClient.invalidateQueries({ queryKey: ["products"] });

			console.log("[fetchProducts] Cache invalidated successfully");
		} catch (error) {
			console.error("Error fetching products:", error);
			toast({
				title: "Error",
				description: "Failed to fetch products",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (formData: any, imageFiles?: File[]) => {
		setIsSubmitting(true);
		try {
			let imageUrls: string[] = [];

			// Upload images if provided
			if (imageFiles && imageFiles.length > 0) {
				imageUrls = await uploadProductImages(imageFiles);
			} else if (editingProduct?.images) {
				// Keep existing images if not uploading new ones
				imageUrls = editingProduct.images;
			}

			const { variants, white_background_indices, ...productDataWithoutVariants } = formData;

			// Process white background images if marked
			if (white_background_indices && white_background_indices.length > 0 && imageUrls.length > 0) {
				console.log("[ProductManagement] Processing white background images...", white_background_indices);
				
				const processedUrls = [...imageUrls];
				
				for (let i = 0; i < white_background_indices.length; i++) {
					const index = white_background_indices[i];
					if (index < processedUrls.length) {
						try {
							const progressMsg = `Processing image ${i + 1} of ${white_background_indices.length}...`;
							console.log(`[ProductManagement] ${progressMsg}`);
							
							const result = await removeBackground(processedUrls[index], {
								throwOnError: false,
								onProgress: (msg) => {
									console.log(`[ProductManagement] Progress: ${msg}`);
									// Emit progress event
									window.dispatchEvent(new CustomEvent('bgRemovalProgress', { 
										detail: { message: msg, current: i + 1, total: white_background_indices.length }
									}));
								},
							});
							
							if (result.success) {
								console.log(`[ProductManagement] Background removal succeeded for image ${index} using ${result.method}`);
								
								// Download and re-upload the processed image
								const processedFile = await downloadProcessedImage(
									result.imageUrl,
									`product-${Date.now()}-${index}.png`
								);
								
								const processedUrls_temp = await uploadProductImages([processedFile]);
								if (processedUrls_temp.length > 0) {
									processedUrls[index] = processedUrls_temp[0];
									console.log(`[ProductManagement] Processed image uploaded: ${processedUrls[index]}`);
									
									// Emit completion event
									window.dispatchEvent(new CustomEvent('bgRemovalProgress', { 
										detail: { 
											message: `Completed image ${i + 1} of ${white_background_indices.length}`,
											current: i + 1, 
											total: white_background_indices.length,
											completed: true 
										}
									}));
								}
							} else {
								console.warn(`[ProductManagement] Background removal failed for image ${index}:`, result.error);
								toast({
									title: "Warning",
									description: `Failed to remove background from image ${index + 1}: ${result.error}. Using original image.`,
									variant: "destructive",
								});
							}
						} catch (bgError) {
							console.error(`[ProductManagement] Error processing image at index ${index}:`, bgError);
							toast({
								title: "Warning",
								description: `Error processing image ${index + 1}. Using original image.`,
								variant: "destructive",
							});
						}
					}
				}
				
				imageUrls = processedUrls;

				// Check if credits are running low
				if (isRemoveBgCreditsLow()) {
					const credits = getRemoveBgCredits();
					toast({
						title: "Low Credits Warning",
						description: `You have only ${credits} remove.bg credits remaining. Consider upgrading your plan.`,
						variant: "destructive",
					});
				}
			}

			// Build product data with explicit null handling
			const productData = {
				name: productDataWithoutVariants.name,
				brand: productDataWithoutVariants.brand || null,
				category: productDataWithoutVariants.category,
				gender: productDataWithoutVariants.gender,
				price: productDataWithoutVariants.price,
				discount_price: productDataWithoutVariants.discount_price || null,
				stock_quantity: productDataWithoutVariants.stock_quantity || 0,
				sizes: productDataWithoutVariants.sizes || [],
				colors: productDataWithoutVariants.colors || [],
				tags:
					productDataWithoutVariants.tags &&
					productDataWithoutVariants.tags.length > 0
						? productDataWithoutVariants.tags
						: [],
				description: productDataWithoutVariants.description || null,
				status: productDataWithoutVariants.status,
				is_featured: productDataWithoutVariants.is_featured || false,
				images: imageUrls && imageUrls.length > 0 ? imageUrls : null,
				image_url: imageUrls && imageUrls.length > 0 ? imageUrls[0] : null,
				white_background_indices: white_background_indices || [],
				has_white_background: (white_background_indices && white_background_indices.length > 0) ? true : false,
			};

			console.log(
				"[handleSubmit] All form data received:",
				JSON.stringify(productDataWithoutVariants, null, 2),
			);
			console.log(
				"[handleSubmit] Product data to save (explicit):",
				JSON.stringify(productData, null, 2),
			);

			if (editingProduct) {
				// Update product
				console.log("[handleSubmit] Updating product:", editingProduct.id, "with data:", productData);
				const { error } = await supabase
					.from("products")
					.update(productData)
					.eq("id", editingProduct.id);

				if (error) throw error;
				console.log("[handleSubmit] Update successful for product:", editingProduct.id);

				// Update variants if provided
				if (variants && variants.length > 0) {
					// Fetch existing variants from database
					const { data: existingVariants, error: fetchError } = await supabase
						.from("product_variants")
						.select("*")
						.eq("product_id", editingProduct.id);

					if (fetchError) throw fetchError;

					// Find variants to delete (exist in DB but not in new data)
					const variantsToDelete = (existingVariants || []).filter(
						(existing: any) =>
							!variants.some(
								(v: any) => v.size === existing.size && v.color === existing.color,
							),
					);

					// Find new variants to insert (in new data but not in DB)
					const variantsToInsert = variants.filter(
						(v: any) =>
							!(existingVariants || []).some(
								(existing: any) => existing.size === v.size && existing.color === v.color,
							),
					);

					// Find variants to update (exist in both)
					const variantsToUpdate = variants.filter(
						(v: any) =>
							(existingVariants || []).some(
								(existing: any) => existing.size === v.size && existing.color === v.color,
							),
					);

					// Delete variants that are no longer needed
					if (variantsToDelete.length > 0) {
						for (const variant of variantsToDelete) {
							await supabase
								.from("product_variants")
								.delete()
								.eq("product_id", editingProduct.id)
								.eq("size", variant.size)
								.eq("color", variant.color);
						}
					}

					// Insert new variants
					if (variantsToInsert.length > 0) {
						const variantsPayload = variantsToInsert.map((v: any) => ({
							product_id: editingProduct.id,
							size: v.size,
							color: v.color,
							stock_quantity: v.stock_quantity,
							sku: v.sku || null,
							price_override: v.price_override || null,
						}));

						const { error: variantInsertError } = await supabase
							.from("product_variants")
							.insert(variantsPayload);

						if (variantInsertError) throw variantInsertError;
					}

					// Update existing variants (if stock or price changed)
					if (variantsToUpdate.length > 0) {
						for (const variant of variantsToUpdate) {
							await supabase
								.from("product_variants")
								.update({
									stock_quantity: variant.stock_quantity,
									sku: variant.sku || null,
									price_override: variant.price_override || null,
								})
								.eq("product_id", editingProduct.id)
								.eq("size", variant.size)
								.eq("color", variant.color);
						}
					}
				}

				toast({
					title: "Success",
					description: "Product updated successfully",
				});
			} else {
				// Create new product
				const { data: newProduct, error: insertError } = await supabase
					.from("products")
					.insert([productData])
					.select("id, name, price, category")
					.single();

				if (insertError) throw insertError;
				if (!newProduct) throw new Error("Failed to create product");

				// Insert variants if provided
				if (variants && variants.length > 0) {
					const variantsPayload = variants.map((v: any) => ({
						product_id: newProduct.id,
						size: v.size,
						color: v.color,
						stock_quantity: v.stock_quantity,
						sku: v.sku || null,
						price_override: v.price_override || null,
					}));

					const { error: variantError } = await supabase
						.from("product_variants")
						.insert(variantsPayload);

					if (variantError) throw variantError;
				}

				toast({
					title: "Success",
					description: "Product added successfully",
				});
			}

			resetForm();
			await fetchProducts();

			// Invalidate product queries
			await queryClient.invalidateQueries({ queryKey: ["products"] });
			await queryClient.invalidateQueries({
				queryKey: ["product-variants"],
			});
		} catch (error) {
			console.error("Error saving product:", error);
			const errorMsg =
				error instanceof Error ? error.message : JSON.stringify(error);
			console.error("Error details:", errorMsg);
			toast({
				title: "Error",
				description: errorMsg || "Failed to save product",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleStatusChange = async (productId: string, newStatus: string) => {
		try {
			console.log(
				`[Status Change] Updating product ${productId} to status: ${newStatus}`,
			);

			const { error } = await supabase
				.from("products")
				.update({ status: newStatus })
				.eq("id", productId);

			if (error) throw error;

			console.log(
				`[Status Change] Supabase update successful, invalidating cache...`,
			);

			toast({
				title: "Success",
				description: `Product status changed to ${newStatus}`,
			});

			// Invalidate all related cache queries
			console.log(`[Status Change] Invalidating React Query cache...`);
			await queryClient.invalidateQueries({ queryKey: ["products"] });
			await queryClient.refetchQueries({ queryKey: ["products"] });

			console.log(`[Status Change] Fetching fresh data from database...`);
			await fetchProducts();

			console.log(
				`[Status Change] Complete - product ${productId} now has status: ${newStatus}`,
			);
		} catch (error) {
			console.error("Error updating product status:", error);
			toast({
				title: "Error",
				description: "Failed to update product status",
				variant: "destructive",
			});
		}
	};

	const handleDelete = async (productId: string) => {
		try {
			const { error } = await supabase
				.from("products")
				.delete()
				.eq("id", productId);

			if (error) throw error;

			toast({ title: "Success", description: "Product deleted successfully" });
			setProductToDelete(null);
			await fetchProducts();
		} catch (error: any) {
			console.error("Error deleting product:", error);
			toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
		}
	};

	const startEdit = (product: Product) => {
		console.log("[startEdit] Opening drawer with product:", {
			productId: product.id,
			name: product.name,
			images: product.images?.length,
			white_background_indices: product.white_background_indices,
			has_white_background: product.has_white_background,
		});
		setEditingProduct(product);
		setIsDrawerOpen(true);
	};

	const resetForm = () => {
		setShowAddForm(false);
		setEditingProduct(null);
		setIsDrawerOpen(false);
	};

	if (isLoading) {
		return <div className="text-center py-8">Loading products...</div>;
	}

	return (
		<div className="space-y-6">
			{/* Sticky section header — z-40 slides over admin header (z-30) as you scroll */}
			<header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between h-14">
				<div>
					<h1 className="font-display text-lg">Product Management</h1>
					<p className="text-xs text-muted-foreground">Inventory & catalogue operations</p>
				</div>
				<Button size="sm" onClick={() => setShowAddForm(true)} className="bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
					<Plus className="w-4 h-4 mr-1" />
					Add Product
				</Button>
			</header>

			{/* Stats Cards — matches AnalyticsCards style */}
			<section>
				<h2 className="text-sm font-medium mb-4 uppercase tracking-wider text-muted-foreground">
					Inventory Metrics
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[
						{ label: "Total Products", value: productStats.total, icon: Package, color: "text-slate-600" },
						{ label: "Active", value: productStats.active, icon: CheckCircle2, color: "text-green-600" },
						{ label: "Draft", value: productStats.draft, icon: FileText, color: "text-slate-600" },
						{ label: "Archived", value: productStats.archived, icon: Archive, color: "text-slate-600" },
						{ label: "Variants Out of Stock", value: productStats.outOfStock, icon: AlertCircle, color: "text-red-600" },
						{ label: "Variants Low Stock", value: productStats.lowStock, icon: Zap, color: "text-amber-600" },
					].map(({ label, value, icon: Icon, color }) => (
						<Card key={label} className="border-0 bg-white p-6 rounded-none shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
									<p className="text-2xl font-display font-medium">{value}</p>
								</div>
								<Icon className={`w-5 h-5 ${color} opacity-60`} />
							</div>
						</Card>
					))}
				</div>
			</section>

			{/* Stock alerts — compact summary */}
			<section>
				{isLoadingAlerts ? (
					<Card className="border-0 bg-amber-50 p-4 rounded-none">
						<Skeleton className="h-6 w-48" />
					</Card>
				) : !variantAlerts || variantAlerts.length === 0 ? (
					<Card className="border border-green-200 bg-green-50 p-4 rounded-none">
						<div className="flex items-center gap-2">
							<CheckCircle2 className="w-4 h-4 text-green-600" />
							<p className="text-sm font-medium text-green-900">All variants in stock</p>
						</div>
					</Card>
				) : (
					<Card className="border border-amber-200 bg-amber-50 rounded-none">
						<div className="flex items-center justify-between p-4">
							<div className="flex items-center gap-3">
								<AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
								<p className="text-sm text-amber-900">
									{productStats.outOfStock > 0 && (
										<span className="font-semibold text-red-700">{productStats.outOfStock} depleted</span>
									)}
									{productStats.outOfStock > 0 && productStats.lowStock > 0 && (
										<span className="text-amber-700">, </span>
									)}
									{productStats.lowStock > 0 && (
										<span className="font-semibold text-amber-700">{productStats.lowStock} low stock</span>
									)}
									<span className="text-amber-700 font-normal"> — variants need attention</span>
								</p>
							</div>
							<Button
								size="sm"
								variant="outline"
								className="rounded-none text-xs bg-white hover:bg-amber-50 flex-shrink-0 ml-4"
								onClick={() => setShowStockSheet(true)}>
								View All
								<ChevronRight className="w-3 h-3 ml-1" />
							</Button>
						</div>
					</Card>
				)}
			</section>

			{/* Search & Filter Toolbar */}
			<Card className="border-border">
				<CardContent className="p-4 space-y-4 md:space-y-0">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
						{/* Search */}
						<div className="relative lg:col-span-2">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
							<Input
								placeholder="Search by name, brand, category..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 rounded-none"
							/>
						</div>

						{/* Category Filter */}
						<div className="flex gap-2 items-center">
							<Select value={filterCategory} onValueChange={setFilterCategory}>
								<SelectTrigger className="rounded-none flex-1">
									<SelectValue placeholder="All Categories" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((cat) => (
										<SelectItem key={cat} value={cat}>
											{cat}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{filterCategory && (
								<Button
									size="sm"
									variant="ghost"
									onClick={() => setFilterCategory("")}
									className="px-2">
									<XIcon className="w-4 h-4" />
								</Button>
							)}
						</div>

						{/* Status Filter */}
						<div className="flex gap-2 items-center">
							<Select value={filterStatus} onValueChange={setFilterStatus}>
								<SelectTrigger className="rounded-none flex-1">
									<SelectValue placeholder="All Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="archived">Archived</SelectItem>
								</SelectContent>
							</Select>
							{filterStatus && (
								<Button
									size="sm"
									variant="ghost"
									onClick={() => setFilterStatus("")}
									className="px-2">
									<XIcon className="w-4 h-4" />
								</Button>
							)}
						</div>

						{/* Sort */}
						<Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
							<SelectTrigger className="rounded-none">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="newest">Newest</SelectItem>
								<SelectItem value="oldest">Oldest</SelectItem>
								<SelectItem value="price-low">Price (Low to High)</SelectItem>
								<SelectItem value="price-high">Price (High to Low)</SelectItem>
								<SelectItem value="alphabetical">Alphabetical</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Clear filters button */}
					{(searchQuery || filterCategory || filterStatus) && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setSearchQuery("");
								setFilterCategory("");
								setFilterStatus("");
							}}
							className="text-xs">
							Clear Filters
						</Button>
					)}
				</CardContent>
			</Card>

			{/* Add Product Form Card */}
			{showAddForm && (
				<Card className="border-border">
					<CardContent className="p-6">
						<h3 className="text-lg font-semibold mb-4">Add New Product</h3>
						<ProductForm
							onSubmit={handleSubmit}
							isLoading={isSubmitting}
							isInDrawer={false}
						/>
						<Button
							variant="outline"
							onClick={resetForm}
							disabled={isSubmitting}
							className="mt-4">
							Cancel
						</Button>
					</CardContent>
				</Card>
			)}
			{/* Product Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredProducts.map((product) => {
				// Calculate total stock from variants if available
				const variants = productVariants[product.id] || [];
				const totalStock = variants.length > 0
					? variants.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0)
					: product.stock_quantity || 0;
				const isLowStock = totalStock > 0 && totalStock <= 5;
				const isOutOfStock = totalStock === 0;
				const primaryImage = product.images?.[0] || product.image_url;

				const statusColor =
					product.status === "active"
						? "bg-green-100 text-green-700"
						: product.status === "draft"
							? "bg-neutral-100 text-neutral-700"
							: "bg-gray-100 text-gray-700";

				return (
					<Card
						key={product.id}
						className="overflow-hidden border-border hover:border-foreground/50 transition-all group">
						{/* Image container with hover overlay */}
							<div className="relative overflow-hidden bg-secondary/50 aspect-square">
								{primaryImage ? (
									<img
										src={primaryImage}
										alt={product.name}
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-muted-foreground">
										No Image
									</div>
								)}

								{/* Status badge - top left */}
								<div className="absolute top-3 left-3">
									<span
										className={`inline-block px-2.5 py-1 rounded text-xs font-semibold uppercase ${statusColor}`}>
										{product.status || "active"}
									</span>
								</div>

								{/* Stock status - top right */}
								{isOutOfStock && (
									<div className="absolute top-3 right-3">
										<span className="inline-block px-2.5 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold uppercase">
											Out of Stock
										</span>
									</div>
								)}
								{isLowStock && !isOutOfStock && (
									<div className="absolute top-3 right-3">
										<span className="inline-block px-2.5 py-1 rounded bg-amber-100 text-amber-700 text-xs font-semibold uppercase">
											Low Stock
										</span>
									</div>
								)}

								{/* Featured badge */}
								{product.is_featured && (
									<div className="absolute bottom-3 left-3">
										<span className="inline-block px-2.5 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold uppercase">
											Featured
										</span>
									</div>
								)}

								{/* Quick actions overlay - appears on hover */}
								<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
									<button
										onClick={() => startEdit(product)}
										title="Edit product"
										className="p-2.5 rounded-lg bg-white hover:bg-gray-100 text-foreground transition-colors">
										<Edit className="w-5 h-5" />
									</button>
									<button
										onClick={() => {
											setImageViewerProduct(product);
											setImageViewerOpen(true);
										}}
										title="View full-size image"
										className="p-2.5 rounded-lg bg-white hover:bg-gray-100 text-foreground transition-colors">
										<ImageIcon className="w-5 h-5" />
									</button>
									<button
										onClick={() => setProductToDelete(product)}
										title="Delete product"
										className="p-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">
										<Trash2 className="w-5 h-5" />
									</button>
								</div>
							</div>

					{/* Card content */}
					<CardContent className="p-4">
						{/* Product name and brand */}
						<h3 className="font-semibold text-base mb-1 line-clamp-2">
							{product.name}
						</h3>
						{product.brand && (
							<p className="text-xs text-muted-foreground mb-2">
								{product.brand}
							</p>
						)}
						{product.category && (
							<p className="text-xs text-muted-foreground mb-3">
								{product.category}
							</p>
						)}

						{/* Pricing */}
						<div className="mb-3">
							{product.discount_price ? (
								<div className="flex items-center gap-2">
									<span className="line-through text-muted-foreground text-sm">
										{formatKES(product.price)}
									</span>
									<span className="text-sm font-semibold text-foreground">
										{formatKES(product.discount_price)}
									</span>
								</div>
							) : (
								<span className="text-sm font-semibold text-foreground">
									{formatKES(product.price)}
								</span>
							)}
						</div>

						{/* Stock info */}
						<div className="mb-3 text-xs">
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">Stock</span>
								<span className={`font-medium ${isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-green-600"}`}>
									{totalStock} {totalStock === 1 ? "unit" : "units"}
								</span>
							</div>
						</div>

						{/* Sizes and colors */}
						{(product.sizes || product.colors) && (
							<div className="mb-3 text-xs text-muted-foreground space-y-1">
								{product.sizes && product.sizes.length > 0 && (
									<div>
										<span className="font-medium">Sizes:</span> {product.sizes.join(", ")}
									</div>
								)}
								{product.colors && product.colors.length > 0 && (
									<div>
										<span className="font-medium">Colors:</span> {product.colors.join(", ")}
									</div>
								)}
							</div>
						)}

						{/* Action buttons */}
						<div className="flex gap-2 pt-3 border-t border-border">
							<Button
								size="sm"
								variant="outline"
								onClick={() => startEdit(product)}
								className="flex-1 text-xs rounded-none">
								<Edit className="w-3 h-3 mr-1" />
								Edit
							</Button>
							<Button
								size="sm"
								variant="destructive"
								onClick={() => setProductToDelete(product)}
								className="flex-1 text-xs rounded-none">
								<Trash2 className="w-3 h-3 mr-1" />
								Delete
							</Button>
						</div>
					</CardContent>
				</Card>
			);
			})}
		</div>

			{/* Empty state */}
			{filteredProducts.length === 0 && !isLoading && (
				<div className="text-center py-12">
					<p className="text-muted-foreground">
						{products.length === 0
							? "No products found. Add your first product to get started!"
							: "No products match your filters. Try adjusting your search."}
					</p>
				</div>
			)}

			{/* Edit drawer */}
			<EditProductDrawer
				isOpen={isDrawerOpen}
				product={editingProduct}
				onClose={resetForm}
				onSubmit={handleSubmit}
				isLoading={isSubmitting}
			/>

			{/* Image Viewer Modal */}
			{imageViewerOpen && imageViewerProduct && (
				<ImageViewer
					images={imageViewerProduct.images || []}
					isOpen={imageViewerOpen}
					onClose={() => setImageViewerOpen(false)}
				/>
			)}

			{/* Stock alerts sheet */}
			<Sheet open={showStockSheet} onOpenChange={setShowStockSheet}>
				<SheetContent className="w-full sm:max-w-md overflow-y-auto">
					<SheetHeader className="mb-4">
						<SheetTitle className="flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-amber-600" />
							Stock Alerts ({variantAlerts?.length ?? 0} variants)
						</SheetTitle>
					</SheetHeader>

					{variantAlerts && variantAlerts.length > 0 && (
						<div className="space-y-2">
							{/* Depleted first */}
							{variantAlerts.filter(v => v.stock_quantity === 0).length > 0 && (
								<p className="text-xs uppercase tracking-wider font-semibold text-red-700 mb-1">
									Depleted ({variantAlerts.filter(v => v.stock_quantity === 0).length})
								</p>
							)}
							{variantAlerts.filter(v => v.stock_quantity === 0).map(item => {
								const product = products.find(p => p.id === item.product_id);
								return (
									<div key={item.id} className="flex items-center gap-3 p-3 border border-red-200 bg-red-50">
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate">{(item.products as any)?.name}</p>
											<p className="text-xs text-muted-foreground">
												{[item.size, item.color].filter(Boolean).join(" · ")}
											</p>
											<p className="text-xs font-semibold text-red-700 mt-0.5">Out of stock</p>
										</div>
										{product && (
											<Button size="sm" variant="outline" className="rounded-none text-xs flex-shrink-0"
												onClick={() => { setShowStockSheet(false); startEdit(product); }}>
												<Edit className="w-3 h-3 mr-1" /> Edit
											</Button>
										)}
									</div>
								);
							})}

							{/* Low stock */}
							{variantAlerts.filter(v => v.stock_quantity > 0).length > 0 && (
								<p className="text-xs uppercase tracking-wider font-semibold text-amber-700 mt-4 mb-1">
									Low Stock ({variantAlerts.filter(v => v.stock_quantity > 0).length})
								</p>
							)}
							{variantAlerts.filter(v => v.stock_quantity > 0).map(item => {
								const product = products.find(p => p.id === item.product_id);
								return (
									<div key={item.id} className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50">
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate">{(item.products as any)?.name}</p>
											<p className="text-xs text-muted-foreground">
												{[item.size, item.color].filter(Boolean).join(" · ")}
											</p>
											<p className="text-xs font-semibold text-amber-700 mt-0.5">{item.stock_quantity} units left</p>
										</div>
										{product && (
											<Button size="sm" variant="outline" className="rounded-none text-xs flex-shrink-0"
												onClick={() => { setShowStockSheet(false); startEdit(product); }}>
												<Edit className="w-3 h-3 mr-1" /> Edit
											</Button>
										)}
									</div>
								);
							})}
						</div>
					)}
				</SheetContent>
			</Sheet>

			{/* Delete confirmation dialog */}
			<AlertDialog open={!!productToDelete} onOpenChange={(open) => { if (!open) setProductToDelete(null); }}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete product?</AlertDialogTitle>
						<AlertDialogDescription>
							<span className="font-medium">{productToDelete?.name}</span> will be permanently deleted.
							If it exists in orders it will be archived instead.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => productToDelete && handleDelete(productToDelete.id)}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default ProductManagement;
