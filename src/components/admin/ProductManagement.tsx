import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
} from "@/components/ui/card";
import { Plus, Edit, Trash2, Copy, Search, Filter, X as XIcon, Image as ImageIcon } from "lucide-react";
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
import { formatKES } from "@/lib/format";
import { removeBackground, downloadProcessedImage } from "@/lib/backgroundRemoval";
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
				
				for (const index of white_background_indices) {
					if (index < processedUrls.length) {
						try {
							console.log(`[ProductManagement] Processing image at index ${index}...`);
							
							const result = await removeBackground(processedUrls[index], {
								throwOnError: false,
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
				const { error } = await supabase
					.from("products")
					.update(productData)
					.eq("id", editingProduct.id);

				if (error) throw error;

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
		if (!confirm("Are you sure you want to delete this product?")) return;

		try {
			const { error } = await supabase
				.from("products")
				.delete()
				.eq("id", productId);

			if (error) throw error;

			toast({
				title: "Success",
				description: "Product deleted successfully",
			});

			await fetchProducts();
		} catch (error) {
			console.error("Error deleting product:", error);
			toast({
				title: "Error",
				description: "Failed to delete product",
				variant: "destructive",
			});
		}
	};

	const startEdit = (product: Product) => {
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
			{/* Header */}
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Product Management</h2>
				<Button onClick={() => setShowAddForm(true)} className="bg-foreground text-background">
					<Plus className="w-4 h-4 mr-2" />
					Add Product
				</Button>
			</div>

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
										onClick={() => handleDelete(product.id)}
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
								onClick={() => handleDelete(product.id)}
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
		</div>
	);
};

export default ProductManagement;
