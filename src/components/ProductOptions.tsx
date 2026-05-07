import React from 'react';
import { cn } from '@/lib/utils';

interface ProductOptionsProps {
  sizes: string[];
  colors: string[];
  selectedSize: string;
  selectedColor: string;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
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
  isOutOfStock = false,
  stockQuantity,
}: ProductOptionsProps) => {
  return (
    <div className="px-5 mt-8 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-eyebrow">Size</h3>
          <button className="text-xs underline text-muted-foreground hover:text-foreground">
            Size guide
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => onSizeChange(size)}
              className={cn(
                'h-11 text-sm font-medium border transition-colors',
                selectedSize === size
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-foreground hover:border-foreground',
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-eyebrow mb-3">
          Color {selectedColor && <span className="normal-case tracking-normal text-foreground">— {selectedColor}</span>}
          {isOutOfStock && selectedSize && <span className="text-xs text-destructive ml-2">Out of Stock</span>}
          {!isOutOfStock && selectedSize && stockQuantity && <span className="text-xs text-muted-foreground ml-2">({stockQuantity} available)</span>}
        </h3>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={cn(
                'px-4 h-11 text-sm border transition-colors',
                selectedColor === color
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-foreground hover:border-foreground',
              )}
            >
              {color}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductOptions;
