import React from "react";
import { cn } from "@/lib/utils";

interface ProductOptionsProps {
	sizes: string[];
	colors: string[];
	selectedSize: string;
	selectedColor: string;
	onSizeChange: (size: string) => void;
	onColorChange: (color: string) => void;
	onSizeGuideClick?: () => void;
	isOutOfStock?: boolean;
	stockQuantity?: number;
}

const ProductOptions = ({
	sizes,
	colors,
	selectedSize,
	selectedColor,
	onSizeChange,
	onColorChange,
	onSizeGuideClick,
	isOutOfStock = false,
	stockQuantity,
}: ProductOptionsProps) => {
	return (
		<div className="px-5 mt-8 space-y-6">
			<div>
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-sm font-semibold">Size</h3>
					{onSizeGuideClick && (
						<button 
							onClick={onSizeGuideClick}
							className="text-xs underline text-muted-foreground hover:text-foreground transition-colors"
						>
							Size guide
						</button>
					)}
				</div>
				{sizes.length > 0 ? (
					<div className="grid grid-cols-5 gap-2">
						{sizes.map((size) => (
							<button
								key={size}
								onClick={() => onSizeChange(size)}
								className={cn(
									"h-11 text-sm font-medium border transition-colors rounded",
									selectedSize === size
										? "border-foreground bg-foreground text-background"
										: "border-border text-foreground hover:border-foreground",
								)}>
								{size}
							</button>
						))}
					</div>
				) : (
					<div className="text-sm text-muted-foreground p-3 bg-muted rounded">
						No sizes available for this product
					</div>
				)}
			</div>

			<div>
				<h3 className="text-sm font-semibold mb-3">
					Color{" "}
					{selectedColor && (
						<span className="normal-case tracking-normal text-foreground">
							— {selectedColor}
						</span>
					)}
					{isOutOfStock && selectedSize && (
						<span className="text-xs text-destructive ml-2">
							Out of Stock
						</span>
					)}
					{!isOutOfStock && selectedSize && stockQuantity && (
						<span className="text-xs text-muted-foreground ml-2">
							({stockQuantity} available)
						</span>
					)}
				</h3>
				{colors.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{colors.map((color) => (
							<button
								key={color}
								onClick={() => onColorChange(color)}
								className={cn(
									"px-4 h-11 text-sm border transition-colors rounded",
									selectedColor === color
										? "border-foreground bg-foreground text-background"
										: "border-border text-foreground hover:border-foreground",
								)}>
								{color}
							</button>
						))}
					</div>
				) : (
					<div className="text-sm text-muted-foreground p-3 bg-muted rounded">
						No colors available for this product
					</div>
				)}
			</div>
		</div>
	);
};

export default ProductOptions;
