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
  description,
}: ProductInfoProps) => {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className="px-5 pt-6">
      <p className="text-eyebrow">{brand} · {category}</p>
      <h1 className="text-2xl font-display font-medium text-foreground mt-2">
        {name}
      </h1>

      <div className="flex items-center gap-1.5 mt-2">
        <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
        <span className="text-xs text-foreground">{rating}</span>
        <span className="text-xs text-muted-foreground">({reviews} reviews)</span>
      </div>

      <div className="flex items-baseline gap-3 mt-4">
        <span className="text-2xl font-semibold text-foreground">
          ${price.toFixed(2)}
        </span>
        {originalPrice && (
          <>
            <span className="text-base text-muted-foreground line-through">
              ${originalPrice.toFixed(2)}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-accent">
              {discount}% off
            </span>
          </>
        )}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mt-5">
        {description}
      </p>
    </div>
  );
};

export default ProductInfo;
