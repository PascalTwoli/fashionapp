
import React from 'react';
import { Star } from 'lucide-react';

interface ProductInfoProps {
  category: string;
  rating: number;
  reviews: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  description: string;
}

const ProductInfo = ({ 
  category, 
  rating, 
  reviews, 
  name, 
  brand, 
  price, 
  originalPrice, 
  description 
}: ProductInfoProps) => {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 uppercase">{category}</span>
        <div className="flex items-center">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm text-gray-600 ml-1">{rating} ({reviews})</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">{name}</h2>
      <p className="text-gray-600 mb-4">{brand}</p>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl font-bold text-pink-500">${price.toFixed(2)}</span>
        {originalPrice && (
          <span className="text-lg text-gray-400 line-through">
            ${originalPrice.toFixed(2)}
          </span>
        )}
        {originalPrice && (
          <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded text-sm font-medium">
            {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
          </span>
        )}
      </div>

      <p className="text-gray-600 mb-6">{description}</p>
    </div>
  );
};

export default ProductInfo;
