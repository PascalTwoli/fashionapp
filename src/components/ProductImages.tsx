import React from "react";
import { cn } from "@/lib/utils";

interface ProductImagesProps {
	images: string[];
	productName: string;
	currentImageIndex: number;
	onImageChange: (index: number) => void;
	status?: string;
}

const ProductImages = ({
	images,
	productName,
	currentImageIndex,
	onImageChange,
	status,
}: ProductImagesProps) => {
	// Ensure images is an array and has items
	const validImages = Array.isArray(images) && images.length > 0 ? images : [];
	const currentImage = validImages[currentImageIndex] || "";
	const isArchived = status === "archived";
	console.log("[ProductImages] Rendering:", {
		images,
		validImages,
		currentImage,
		isArchived,
		currentImageIndex,
	});

	return (
		<div className="relative bg-muted lg:h-[calc(100vh-4rem)]">
			<div className="aspect-[3/4] lg:aspect-auto lg:h-full overflow-hidden">
				{isArchived ? (
					<div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
						<div className="text-center">
							<div className="text-5xl font-bold text-slate-500 mb-3">
								📦
							</div>
							<span className="text-slate-600 font-semibold block mb-1">
								No longer in stock
							</span>
							<span className="text-slate-500 text-sm">
								This item has been archived
							</span>
						</div>
					</div>
				) : currentImage ? (
					<img
						src={currentImage}
						alt={productName}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full bg-gray-200 flex items-center justify-center">
						<span className="text-gray-500">No image available</span>
					</div>
				)}
			</div>

			{validImages.length > 1 && (
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
					{validImages.map((_, index) => (
						<button
							key={index}
							onClick={() => onImageChange(index)}
							aria-label={`Image ${index + 1}`}
							className={cn(
								"h-1 transition-all",
								currentImageIndex === index
									? "w-6 bg-foreground"
									: "w-3 bg-foreground/30",
							)}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default ProductImages;
