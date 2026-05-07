import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatKES } from "@/lib/format";
import ProductForm from "./ProductForm";
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
	gender: string | null;
	stock_quantity: number | null;
	sizes: string[] | null;
	colors: string[] | null;
	tags: string[] | null;
	status: string | null;
	is_featured: boolean | null;
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
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		fetchProducts();
	}, []);

	// Initialize Supabase Storage bucket
	const ensureBucketExists = async () => {
		try {
			const { data } = await supabase.storage.listBuckets();
			const bucketExists = data?.some((b) => b.name === "products");

			if (!bucketExists) {
				await supabase.storage.createBucket("products", { public: true });
			}
		} catch (error) {
			console.warn("Bucket check/creation attempted:", error);
			// Bucket may already exist or user may not have permission, continue anyway
		}
	};

	// Handle image file selection and upload
	const handleImageUpload = async (file: File) => {
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast({
				title: "Error",
				description: "Please select an image file",
				variant: "destructive",
			});
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast({
				title: "Error",
				description: "Image size must be less than 5MB",
				variant: "destructive",
			});
			return;
		}

		// Show image preview
		const reader = new FileReader();
		reader.onload = (e) => {
			setImagePreview(e.target?.result as string);
		};
		reader.readAsDataURL(file);

		// Upload image to Supabase Storage
		setIsUploadingImage(true);
		try {
			// Generate unique filename with sanitized name
			const timestamp = Date.now();
			const randomString = Math.random().toString(36).substring(2, 8);
			// Remove special characters and spaces from filename
			const sanitizedName = file.name
				.replace(/[^a-zA-Z0-9.-]/g, "-")
				.replace(/-+/g, "-")
				.toLowerCase();
			const filename = `${timestamp}-${randomString}-${sanitizedName}`;

			console.log("Uploading file:", filename);

			// Upload to Supabase Storage
			const { error: uploadError } = await supabase.storage
				.from("products")
				.upload(filename, file);

			if (uploadError) {
				console.error("Upload error:", uploadError);
				throw uploadError;
			}

			console.log("File uploaded successfully");

			// Get public URL
			const { data } = supabase.storage
				.from("products")
				.getPublicUrl(filename);

			const publicUrl = data.publicUrl;
			console.log("Public URL:", publicUrl);

			// Update form data with image URL
			setFormData((prev) => ({
				...prev,
				image_url: publicUrl,
			}));

			toast({
				title: "Success",
				description: "Image uploaded successfully",
			});
		} catch (error) {
			console.error("Error uploading image:", error);
			toast({
				title: "Error",
				description:
					"Failed to upload image. Make sure the 'products' bucket exists in Supabase Storage.",
				variant: "destructive",
			});
			setImagePreview(null);
		} finally {
			setIsUploadingImage(false);
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	// Handle file input change
	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleImageUpload(file);
		}
	};

	// Handle drag and drop
	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const file = e.dataTransfer.files?.[0];
		if (file) {
			handleImageUpload(file);
		}
	};

	// Clear image preview and URL
	const clearImage = () => {
		setImagePreview(null);
		setFormData((prev) => ({
			...prev,
			image_url: "",
		}));
	};

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
			console.log(
				"[fetchProducts] Product statuses:",
				(data || []).map((p: any) => ({ id: p.id, status: p.status })),
			);

			setProducts(data || []);

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

			const { variants, ...productDataWithoutVariants } = formData;

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
					// Delete existing variants
					await supabase
						.from("product_variants")
						.delete()
						.eq("product_id", editingProduct.id);

					// Insert new variants
					const variantsPayload = variants.map((v: any) => ({
						product_id: editingProduct.id,
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
		setShowAddForm(true);
	};

	const resetForm = () => {
		setShowAddForm(false);
		setEditingProduct(null);
	};

	if (isLoading) {
		return <div className="text-center py-8">Loading products...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Product Management</h2>
				<Button onClick={() => setShowAddForm(true)}>
					<Plus className="w-4 h-4 mr-2" />
					Add Product
				</Button>
			</div>

			{(showAddForm || editingProduct) && (
				<Card>
					<CardHeader>
						<CardTitle>
							{editingProduct ? "Edit Product" : "Add New Product"}
						</CardTitle>
						<CardDescription>
							{editingProduct
								? "Update product information"
								: "Add a new product to your store"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ProductForm
							initialData={editingProduct || undefined}
							onSubmit={handleSubmit}
							isLoading={isSubmitting}
						/>
						<Button
							type="button"
							variant="outline"
							onClick={resetForm}
							disabled={isSubmitting}
							className="mt-4">
							Cancel
						</Button>
					</CardContent>
				</Card>
			)}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{products.map((product) => (
					<Card key={product.id}>
						<CardContent className="p-4">
							{product.images && product.images[0] ? (
								<img
									src={product.images[0]}
									alt={product.name}
									className="w-full h-48 object-cover rounded-lg mb-4"
								/>
							) : product.image_url ? (
								<img
									src={product.image_url}
									alt={product.name}
									className="w-full h-48 object-cover rounded-lg mb-4"
								/>
							) : null}

							<h3 className="font-semibold text-lg">{product.name}</h3>
							{product.brand && (
								<p className="text-sm text-gray-600">{product.brand}</p>
							)}
							<p className="text-sm text-gray-500 mb-2">
								{product.category}
							</p>

							{/* Pricing */}
							<div className="mb-2">
								{product.discount_price ? (
									<div className="flex items-center gap-2">
										<span className="line-through text-gray-400">
											{formatKES(product.price)}
										</span>
										<span className="text-red-500 font-bold">
											{formatKES(product.discount_price)}
										</span>
									</div>
								) : (
									<span className="text-lg font-bold text-foreground">
										{formatKES(product.price)}
									</span>
								)}
							</div>

							<div className="flex items-center justify-between mb-4">
								<span className="text-sm text-gray-500">
									Stock: {product.stock_quantity || 0}
								</span>
								{product.is_featured && (
									<span className="text-xs bg-yellow-200 px-2 py-1 rounded">
										Featured
									</span>
								)}
							</div>

							{/* Status Dropdown */}
							<div className="mb-4">
								<div className="relative group">
									<Button
										size="sm"
										variant="outline"
										className="w-full justify-between">
										<span
											className={`text-xs font-medium uppercase tracking-wider ${
												product.status === "active"
													? "text-green-600"
													: product.status === "draft"
														? "text-blue-600"
														: "text-red-600"
											}`}>
											{product.status || "active"}
										</span>
										<ChevronDown className="w-4 h-4" />
									</Button>

									{/* Dropdown Menu */}
									<div className="absolute left-0 right-0 mt-1 bg-background border border-border rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
										{["active", "draft", "archived"].map((status) => (
											<button
												key={status}
												onClick={(e) => {
													e.preventDefault();
													handleStatusChange(product.id, status);
												}}
												className={`w-full text-left px-3 py-2 text-xs uppercase tracking-wider hover:bg-muted transition-colors ${
													product.status === status
														? "bg-muted font-semibold"
														: ""
												}`}>
												{status}
											</button>
										))}
									</div>
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									{product.status === "active" &&
										"✓ Visible on storefront"}
									{product.status === "draft" &&
										"✕ Hidden from shoppers"}
									{product.status === "archived" &&
										"⊗ Archived - no image display"}
								</p>
							</div>

							{product.sizes && product.sizes.length > 0 && (
								<p className="text-xs text-gray-500 mb-2">
									Sizes: {product.sizes.join(", ")}
								</p>
							)}

							{product.tags && product.tags.length > 0 && (
								<div className="flex flex-wrap gap-1 mb-4">
									{product.tags.map((tag) => (
										<span
											key={tag}
											className="text-xs bg-gray-200 px-2 py-1 rounded">
											{tag}
										</span>
									))}
								</div>
							)}

							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => startEdit(product)}>
									<Edit className="w-4 h-4 mr-1" />
									Edit
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onClick={() => handleDelete(product.id)}>
									<Trash2 className="w-4 h-4 mr-1" />
									Delete
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{products.length === 0 && !isLoading && (
				<div className="text-center py-12">
					<p className="text-gray-500">
						No products found. Add your first product to get started!
					</p>
				</div>
			)}
		</div>
	);
};

export default ProductManagement;
