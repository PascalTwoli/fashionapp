
import React from 'react';

interface ProductOptionsProps {
  sizes: string[];
  colors: string[];
  selectedSize: string;
  selectedColor: string;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
}

const ProductOptions = ({ 
  sizes, 
  colors, 
  selectedSize, 
  selectedColor, 
  onSizeChange, 
  onColorChange 
}: ProductOptionsProps) => {
  return (
    <div className="px-4">
      {/* Size Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => onSizeChange(size)}
              className={`px-4 py-2 rounded-lg border ${
                selectedSize === size
                  ? 'border-pink-500 bg-pink-50 text-pink-600'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Color</h3>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`px-4 py-2 rounded-lg border ${
                selectedColor === color
                  ? 'border-pink-500 bg-pink-50 text-pink-600'
                  : 'border-gray-300 text-gray-600'
              }`}
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
