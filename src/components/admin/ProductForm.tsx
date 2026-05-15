import React, { useState, useCallback, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Cloud, GripVertical, Copy, Trash2, Eye } from "lucide-react";
import ResizableGoogleDrivePicker from "@/components/ResizableGoogleDrivePicker";
import ImageViewer from "@/components/ImageViewer";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const productSchema = z.object({
	name: z.string().min(2, "Product name must be at least 2 characters"),
	brand: z.string().optional(),
	category: z.string().min(1, "Category is required"),
	gender: z.enum(["men", "women", "unisex"]),
	price: z.coerce.number().positive("Price must be positive"),
	discount_price: z.coerce.number().positive().optional(),
	stock_quantity: z.coerce
		.number()
		.min(0, "Stock cannot be negative")
		.optional(), // Legacy field for backward compatibility
	sizes: z.array(z.string()).min(1, "Add at least one size"),
	colors: z.array(z.string()).min(1, "Add at least one color"),
	tags: z.array(z.string()).optional(),
	description: z.string().optional(),
	status: z.enum(["active", "draft", "archived"]),
	is_featured: z.boolean().default(false),
	variants: z
		.array(
			z.object({
				size: z.string().min(1, "Size required"),
				color: z.string().min(1, "Color required"),
				stock_quantity: z.coerce.number().min(0, "Stock must be >= 0"),
				sku: z.string().optional(),
				price_override: z.coerce.number().optional(),
			}),
		)
		.optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductVariantRow {
	size: string;
	color: string;
	stock_quantity: number;
	sku?: string;
	price_override?: number;
}

interface ProductFormProps {
	initialData?: Partial<ProductFormData> & { images?: string[] };
	onSubmit: (data: ProductFormData, images?: File[]) => Promise<void>;
	isLoading?: boolean;
	onChange?: () => void;
	isInDrawer?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
	initialData,
	onSubmit,
	isLoading = false,
	onChange,
	isInDrawer = false,
}) => {
	const { user } = useAuth();
	const { isAdmin } = useUserRole();
	const [imageFiles, setImageFiles] = useState<File[]>([]);
	const [imagePreviews, setImagePreviews] = useState<string[]>(
		initialData?.images || [],
	);
	const [isGooglePickerOpen, setIsGooglePickerOpen] = useState(false);
	const [viewerOpen, setViewerOpen] = useState(false);
	const [viewerIndex, setViewerIndex] = useState(0);
	const [draggedFrom, setDraggedFrom] = useState<number | null>(null);
	const [newSizeInput, setNewSizeInput] = useState("");
	const [newColorInput, setNewColorInput] = useState("");
	const [newTagInput, setNewTagInput] = useState("");
	const [variants, setVariants] = useState<ProductVariantRow[]>(
		(initialData?.variants as ProductVariantRow[]) || [],
	);

	// Call onChange callback when form data changes
	const handleFormChange = useCallback(() => {
		if (onChange) onChange();
	}, [onChange]);

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
		watch,
		setValue,
		reset,
	} = useForm<ProductFormData>({
		resolver: zodResolver(productSchema),
		defaultValues: {
			...initialData,
			status: initialData?.status || "active",
			is_featured: initialData?.is_featured || false,
			sizes: initialData?.sizes || [],
			colors: initialData?.colors || [],
			tags: initialData?.tags || [],
		},
	});

	// Update form when initialData changes (e.g., when variants are loaded)
	useEffect(() => {
		if (initialData) {
			reset({
				...initialData,
				status: initialData?.status || "active",
				is_featured: initialData?.is_featured || false,
				sizes: initialData?.sizes || [],
				colors: initialData?.colors || [],
				tags: initialData?.tags || [],
				variants: initialData?.variants,
			});
			// Update local variants state
			if (initialData.variants && Array.isArray(initialData.variants)) {
				setVariants(initialData.variants as ProductVariantRow[]);
			}
		}
	}, [initialData, reset]);

	const sizes = watch("sizes");
	const colors = watch("colors");
	const tags = watch("tags");

	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		files.forEach((file) => {
			const reader = new FileReader();
			reader.onload = (ev) => {
				setImagePreviews((prev) => [...prev, ev.target?.result as string]);
			};
			reader.readAsDataURL(file);
		});
		setImageFiles((prev) => [...prev, ...files]);
		handleFormChange();
	};

	const removeImage = (index: number) => {
		setImagePreviews((prev) => prev.filter((_, i) => i !== index));
		setImageFiles((prev) => prev.filter((_, i) => i !== index));
		handleFormChange();
	};

	// Drag and drop reordering
	const handleDragStart = (index: number) => {
		setDraggedFrom(index);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (index: number) => {
		if (draggedFrom === null || draggedFrom === index) return;

		const newPreviews = [...imagePreviews];
		const newFiles = [...imageFiles];

		// Swap positions
		[newPreviews[draggedFrom], newPreviews[index]] = [
			newPreviews[index],
			newPreviews[draggedFrom],
		];

		if (newFiles.length > draggedFrom && newFiles.length > index) {
			[newFiles[draggedFrom], newFiles[index]] = [
				newFiles[index],
				newFiles[draggedFrom],
			];
		}

		setImagePreviews(newPreviews);
		setImageFiles(newFiles);
		setDraggedFrom(null);
		handleFormChange();
	};

	const setAsPrimary = (index: number) => {
		if (index === 0) return;
		const newPreviews = [...imagePreviews];
		const newFiles = [...imageFiles];

		// Move to first position
		const preview = newPreviews.splice(index, 1)[0];
		newPreviews.unshift(preview);

		if (newFiles.length > index) {
			const file = newFiles.splice(index, 1)[0];
			newFiles.unshift(file);
		}

		setImagePreviews(newPreviews);
		setImageFiles(newFiles);
		handleFormChange();
	};

	const handleGoogleDriveFilesSelected = async (files: File[]) => {
		// Convert files to previews
		files.forEach((file) => {
			const reader = new FileReader();
			reader.onload = (ev) => {
				setImagePreviews((prev) => [...prev, ev.target?.result as string]);
			};
			reader.readAsDataURL(file);
		});
		// Add files to imageFiles
		setImageFiles((prev) => [...prev, ...files]);
		handleFormChange();
	};

	const addSize = () => {
		if (newSizeInput.trim()) {
			setValue("sizes", [...sizes, newSizeInput.toUpperCase()]);
			setNewSizeInput("");
			handleFormChange();
		}
	};

	const removeSize = (index: number) => {
		setValue(
			"sizes",
			sizes.filter((_, i) => i !== index),
		);
		handleFormChange();
	};

	const addColor = () => {
		if (newColorInput.trim()) {
			setValue("colors", [...colors, newColorInput]);
			setNewColorInput("");
			handleFormChange();
		}
	};

	const removeColor = (index: number) => {
		setValue(
			"colors",
			colors.filter((_, i) => i !== index),
		);
		handleFormChange();
	};

	const addTag = () => {
		if (newTagInput.trim()) {
			setValue("tags", [...(tags || []), newTagInput.toLowerCase()]);
			setNewTagInput("");
			handleFormChange();
		}
	};

	const removeTag = (index: number) => {
		setValue("tags", tags?.filter((_, i) => i !== index) || []);
		handleFormChange();
	};

	const onFormSubmit = async (data: ProductFormData) => {
		try {
			console.log("[ProductForm] onFormSubmit called with data:", data);
			console.log("[ProductForm] Variants:", variants);
			
			// Include variants in the submitted data
			const dataWithVariants = {
				...data,
				variants: variants.length > 0 ? variants : undefined,
			};
			
			console.log("[ProductForm] Submitting data with variants:", dataWithVariants);
			await onSubmit(dataWithVariants, imageFiles);
			console.log("[ProductForm] Submission successful");
		} catch (error) {
			console.error("[ProductForm] Form submission error:", error);
			// Error will be handled by parent component's toast
			throw error;
		}
	};

	const addVariant = (size: string, color: string) => {
		if (!size || !color) {
			alert("Please select both size and color");
			return;
		}

		// Check if variant already exists
		if (variants.some((v) => v.size === size && v.color === color)) {
			alert("This size/color combination already exists");
			return;
		}

		setVariants([
			...variants,
			{
				size,
				color,
				stock_quantity: 0,
			},
		]);
		handleFormChange();
	};

	const updateVariant = (
		index: number,
		field: keyof ProductVariantRow,
		value: any,
	) => {
		const updated = [...variants];
		updated[index] = { ...updated[index], [field]: value };
		setVariants(updated);
		handleFormChange();
	};

	const removeVariant = (index: number) => {
		setVariants(variants.filter((_, i) => i !== index));
		handleFormChange();
	};

	const duplicateVariant = (index: number) => {
		const variant = variants[index];
		setVariants([...variants, { ...variant }]);
		handleFormChange();
	};

	return (
		<>
		<form 
			id="product-form" 
			onSubmit={handleSubmit(
				onFormSubmit,
				(errors) => {
					console.error("[ProductForm] Validation errors:", errors);
					if (Object.keys(errors).length > 0) {
						const errorMessages = Object.entries(errors)
							.map(([field, error]: any) => `${field}: ${error?.message || 'Invalid'}`)
							.join(", ");
						console.error("[ProductForm] Cannot submit - validation failed:", errorMessages);
					}
				}
			)}
			className="space-y-6">
			{/* Basic Info */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<Label htmlFor="name">Product Name *</Label>
					<Input
						id="name"
						placeholder="Nike Air Max"
						{...register("name")}
						disabled={isLoading}
					/>
					{errors.name && (
						<p className="text-red-500 text-sm mt-1">
							{errors.name.message}
						</p>
					)}
				</div>

				<div>
					<Label htmlFor="brand">Brand</Label>
					<Input
						id="brand"
						placeholder="Nike"
						{...register("brand")}
						disabled={isLoading}
					/>
				</div>

				<div>
					<Label htmlFor="category">Category *</Label>
					<Input
						id="category"
						placeholder="Shoes"
						{...register("category")}
						disabled={isLoading}
					/>
					{errors.category && (
						<p className="text-red-500 text-sm mt-1">
							{errors.category.message}
						</p>
					)}
				</div>

				<div>
					<Label htmlFor="gender">Gender *</Label>
					<Select
						defaultValue={initialData?.gender}
						onValueChange={(value) => setValue("gender", value as any)}>
						<SelectTrigger id="gender" disabled={isLoading}>
							<SelectValue placeholder="Select gender" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="men">Men</SelectItem>
							<SelectItem value="women">Women</SelectItem>
							<SelectItem value="unisex">Unisex</SelectItem>
						</SelectContent>
					</Select>
					{errors.gender && (
						<p className="text-red-500 text-sm mt-1">
							{errors.gender.message}
						</p>
					)}
				</div>
			</div>

			{/* Pricing */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<Label htmlFor="price">Price (KES) *</Label>
					<Input
						id="price"
						type="number"
						step="0.01"
						placeholder="9999"
						{...register("price")}
						disabled={isLoading}
					/>
					{errors.price && (
						<p className="text-red-500 text-sm mt-1">
							{errors.price.message}
						</p>
					)}
				</div>

				<div>
					<Label htmlFor="discount_price">Discount Price (KES)</Label>
					<Input
						id="discount_price"
						type="number"
						step="0.01"
						placeholder="7999"
						{...register("discount_price")}
						disabled={isLoading}
					/>
				</div>
			</div>

			{/* Inventory - Note: Now using variants table below */}
			{variants.length === 0 && (
				<div>
					<Label htmlFor="stock_quantity">
						Stock Quantity (Legacy - Use Variants Below)
					</Label>
					<Input
						id="stock_quantity"
						type="number"
						placeholder="50"
						{...register("stock_quantity")}
						disabled={isLoading}
					/>
					<p className="text-xs text-gray-500 mt-1">
						Note: Variants table below will override this value
					</p>
					{errors.stock_quantity && (
						<p className="text-red-500 text-sm mt-1">
							{errors.stock_quantity.message}
						</p>
					)}
				</div>
			)}

			{/* Sizes */}
			<div>
				<Label>Sizes *</Label>
				<div className="flex gap-2 mb-2">
					<Input
						placeholder="e.g., S, M, L, XL"
						value={newSizeInput}
						onChange={(e) => setNewSizeInput(e.target.value)}
						onKeyPress={(e) =>
							e.key === "Enter" && (e.preventDefault(), addSize())
						}
						disabled={isLoading}
					/>
					<Button
						type="button"
						onClick={addSize}
						disabled={isLoading}
						className="px-4">
						Add
					</Button>
				</div>
				<div className="flex flex-wrap gap-2">
					{sizes.map((size, index) => (
						<span
							key={index}
							className="bg-gray-200 px-3 py-1 rounded-full text-sm flex items-center gap-2">
							{size}
							<button
								type="button"
								onClick={() => removeSize(index)}
								disabled={isLoading}
								className="text-red-500 hover:text-red-700">
								<X className="w-4 h-4" />
							</button>
						</span>
					))}
				</div>
				{errors.sizes && (
					<p className="text-red-500 text-sm mt-1">
						{errors.sizes.message}
					</p>
				)}
			</div>

			{/* Colors */}
			<div>
				<Label>Colors *</Label>
				<div className="flex gap-2 mb-2">
					<Input
						placeholder="e.g., Red, Black, White"
						value={newColorInput}
						onChange={(e) => setNewColorInput(e.target.value)}
						onKeyPress={(e) =>
							e.key === "Enter" && (e.preventDefault(), addColor())
						}
						disabled={isLoading}
					/>
					<Button
						type="button"
						onClick={addColor}
						disabled={isLoading}
						className="px-4">
						Add
					</Button>
				</div>
				<div className="flex flex-wrap gap-2">
					{colors.map((color, index) => (
						<span
							key={index}
							className="bg-blue-200 px-3 py-1 rounded-full text-sm flex items-center gap-2">
							{color}
							<button
								type="button"
								onClick={() => removeColor(index)}
								disabled={isLoading}
								className="text-red-500 hover:text-red-700">
								<X className="w-4 h-4" />
							</button>
						</span>
					))}
				</div>
				{errors.colors && (
					<p className="text-red-500 text-sm mt-1">
						{errors.colors.message}
					</p>
				)}
			</div>

			{/* Tags */}
			<div>
				<Label>Variant Inventory</Label>
				<p className="text-sm text-gray-600 mb-3">
					Create size/color combinations with stock quantities
				</p>

				{sizes.length > 0 && colors.length > 0 && (
					<div className="mb-4 flex gap-2 flex-wrap">
						{sizes.map((size) =>
							colors.map((color) => (
								<Button
									key={`${size}-${color}`}
									type="button"
									variant="outline"
									size="sm"
									onClick={() => addVariant(size, color)}
									disabled={
										variants.some(
											(v) => v.size === size && v.color === color,
										) || isLoading
									}>
									+ {size} / {color}
								</Button>
							)),
						)}
					</div>
				)}

				{variants.length > 0 && (
					<div className="border rounded-lg overflow-x-auto">
						<table className="w-full text-xs sm:text-sm min-w-max">
							<thead className="bg-gray-100 border-b">
								<tr>
									<th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">
										Size
									</th>
									<th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">
										Color
									</th>
									<th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">
										Stock
									</th>
									<th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">
										SKU
									</th>
									<th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">
										Price Ovr.
									</th>
									<th className="px-2 sm:px-3 py-2 text-center whitespace-nowrap">
										Action
									</th>
								</tr>
							</thead>
							<tbody>
								{variants.map((variant, index) => (
									<tr
										key={index}
										className="border-b hover:bg-gray-50">
										<td className="px-2 sm:px-3 py-2">
											{variant.size}
										</td>
										<td className="px-2 sm:px-3 py-2">
											{variant.color}
										</td>
										<td className="px-2 sm:px-3 py-2">
											<Input
												type="number"
												min="0"
												value={variant.stock_quantity}
												onChange={(e) =>
													updateVariant(
														index,
														"stock_quantity",
														parseInt(e.target.value) || 0,
													)
												}
												className="w-16 sm:w-20"
												disabled={isLoading}
											/>
										</td>
										<td className="px-2 sm:px-3 py-2">
											<Input
												type="text"
												placeholder="SKU"
												value={variant.sku || ""}
												onChange={(e) =>
													updateVariant(
														index,
														"sku",
														e.target.value,
													)
												}
												className="w-20 sm:w-32"
												disabled={isLoading}
											/>
										</td>
										<td className="px-2 sm:px-3 py-2">
											<Input
												type="number"
												placeholder="Ovr."
												step="0.01"
												value={variant.price_override || ""}
												onChange={(e) =>
													updateVariant(
														index,
														"price_override",
														e.target.value
															? parseFloat(e.target.value)
															: undefined,
													)
												}
												className="w-16 sm:w-24"
												disabled={isLoading}
											/>
										</td>
										<td className="px-2 sm:px-3 py-2 text-center">
										<div className="flex items-center gap-1 justify-center">
											<button
												type="button"
												onClick={() => duplicateVariant(index)}
												disabled={isLoading}
												title="Duplicate variant"
												className="text-blue-500 hover:text-blue-700 p-1">
												<Copy className="w-4 h-4" />
											</button>
											<button
												type="button"
												onClick={() => removeVariant(index)}
												disabled={isLoading}
												title="Remove variant"
												className="text-red-500 hover:text-red-700 p-1">
												<X className="w-4 h-4" />
											</button>
										</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Tags */}
			<div>
				<Label>Tags (Optional)</Label>
				<div className="flex gap-2 mb-2">
					<Input
						placeholder="e.g., summer, casual, trending"
						value={newTagInput}
						onChange={(e) => setNewTagInput(e.target.value)}
						onKeyPress={(e) =>
							e.key === "Enter" && (e.preventDefault(), addTag())
						}
						disabled={isLoading}
					/>
					<Button
						type="button"
						onClick={addTag}
						disabled={isLoading}
						className="px-4">
						Add
					</Button>
				</div>
				<div className="flex flex-wrap gap-2">
					{tags?.map((tag, index) => (
						<span
							key={index}
							className="bg-purple-200 px-3 py-1 rounded-full text-xs flex items-center gap-2">
							{tag}
							<button
								type="button"
								onClick={() => removeTag(index)}
								disabled={isLoading}
								className="text-red-500 hover:text-red-700">
								<X className="w-4 h-4" />
							</button>
						</span>
					))}
				</div>
			</div>

			{/* Images */}
			<div>
				<Label>Product Images</Label>
				<div className="space-y-3">
					{/* Local File Upload */}
					<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
						<input
							type="file"
							multiple
							accept="image/*"
							onChange={handleImageSelect}
							disabled={isLoading}
							className="hidden"
							id="image-input"
						/>
						<label htmlFor="image-input" className="cursor-pointer block">
							<p className="font-medium">Click or drag images to upload</p>
							<p className="text-sm text-gray-500">
								PNG, JPG up to 5MB each
							</p>
						</label>
					</div>

					{/* Google Drive Button */}
					{isAdmin && (
						<Button
							type="button"
							onClick={() => setIsGooglePickerOpen(true)}
							variant="outline"
							className="w-full">
							<Cloud className="w-4 h-4 mr-2" />
							Open Google Drive Picker
						</Button>
					)}
				</div>

				{imagePreviews.length > 0 && (
					<div className="mt-4">
						<p className="text-xs text-muted-foreground mb-3">
							Drag to reorder images. First image will be primary.
						</p>
						<div className={`grid gap-3 ${isInDrawer ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
							{imagePreviews.map((preview, index) => (
								<div
									key={index}
									draggable
									onDragStart={() => handleDragStart(index)}
									onDragOver={handleDragOver}
									onDrop={() => handleDrop(index)}
									className={`relative group rounded-lg border-2 overflow-hidden transition-all cursor-move ${
										draggedFrom === index
											? "border-blue-400 opacity-50"
											: "border-border hover:border-foreground"
									}`}>
									{/* Image */}
									<img
										src={preview}
										alt={`Preview ${index}`}
										className="w-full aspect-square object-cover"
									/>

									{/* Primary badge */}
									{index === 0 && (
										<div className="absolute top-1 left-1 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
											Primary
										</div>
									)}

									{/* Hover actions */}
									<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
										<button
											type="button"
											onClick={() => {
												setViewerIndex(index);
												setViewerOpen(true);
											}}
											disabled={isLoading}
											title="View"
											className="p-2 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors">
											<Eye className="w-4 h-4" />
										</button>
										{index !== 0 && (
											<button
												type="button"
												onClick={() => setAsPrimary(index)}
												disabled={isLoading}
												title="Set as primary">
												<span className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors">
													Primary
												</span>
											</button>
										)}
										<button
											type="button"
											onClick={() => removeImage(index)}
											disabled={isLoading}
											title="Remove"
											className="p-2 rounded-lg bg-red-600/80 hover:bg-red-700 text-white transition-colors">
											<Trash2 className="w-4 h-4" />
										</button>
									</div>

									{/* Drag indicator */}
									{draggedFrom !== index && (
										<div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<GripVertical className="w-4 h-4 text-white drop-shadow" />
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Description */}
			<div>
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					placeholder="Product description..."
					{...register("description")}
					rows={4}
					disabled={isLoading}
				/>
			</div>

			{/* Status & Featured */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<Label htmlFor="status">Status</Label>
					<Select
						defaultValue={initialData?.status || "active"}
						onValueChange={(value) => setValue("status", value as any)}>
						<SelectTrigger id="status" disabled={isLoading}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="draft">Draft</SelectItem>
							<SelectItem value="archived">Archived</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center gap-2 pt-6">
					<Checkbox
						id="is_featured"
						{...register("is_featured")}
						disabled={isLoading}
					/>
					<Label htmlFor="is_featured" className="cursor-pointer">
						Featured Product
					</Label>
				</div>
			</div>

			{/* Submit - only show when not in drawer */}
			{!isInDrawer && (
				<Button type="submit" disabled={isLoading} className="w-full">
					{isLoading ? "Saving..." : "Save Product"}
				</Button>
			)}
		</form>

		<ImageViewer
			images={imagePreviews}
			initialIndex={viewerIndex}
			isOpen={viewerOpen}
			onClose={() => setViewerOpen(false)}
		/>

		<ResizableGoogleDrivePicker
			isOpen={isGooglePickerOpen}
			onClose={() => setIsGooglePickerOpen(false)}
			onFilesSelected={handleGoogleDriveFilesSelected}
		/>
		</>
	);
};

export default ProductForm;
