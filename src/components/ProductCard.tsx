
import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  onProductClick: (id: string) => void;
  className?: string;
}

const ProductCard = ({ 
  id, 
  name, 
  brand, 
  price, 
  originalPrice, 
  image, 
  category,
  onProductClick,
  className 
}: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <div 
      className={cn("bg-white rounded-lg overflow-hidden cursor-pointer", className)}
      onClick={() => onProductClick(id)}
    >
      <div className="relative">
        <img 
          src={image} 
          alt={name}
          className="w-full h-48 object-cover"
        />
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm"
        >
          <Heart 
            className={cn(
              "w-4 h-4",
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
            )}
          />
        </button>
      </div>
      
      <div className="p-3">
        <p className="text-xs text-gray-500 uppercase">{category}</p>
        <h3 className="font-medium text-gray-900 text-sm mt-1">{name}</h3>
        <p className="text-xs text-gray-600">{brand}</p>
        
        <div className="flex items-center gap-2 mt-2">
          <span className="text-pink-500 font-semibold">${price.toFixed(2)}</span>
          {originalPrice && (
            <span className="text-gray-400 text-sm line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
