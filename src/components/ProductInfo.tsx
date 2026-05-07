import React from 'react';
import { Star } from 'lucide-react';
import { formatKES } from '@/lib/format';

interface ProductInfoProps {
  category: string;
  rating?: number;
  reviews?: number;
  name: string;
  brand?: string;
  price: number;
  discount_price?: number;
  gender?: string;
  description?: string;
}

const ProductInfo = ({
  category,
  rating = 4.5,
  reviews = 0,
  name,
  brand,
  price,
  discount_price,
  gender,
  description,
}: ProductInfoProps) => {
  const displayPrice = discount_price && discount_price > 0 ? discount_price : price;
  const originalPrice = discount_price && discount_price > 0 ? price : undefined;
  const discount = originalPrice
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  const genderLabel = gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '';

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {brand && <>{brand} · </>}{category}{genderLabel && <> · {genderLabel}</>}
        </p>
      </div>
      
      <h1 className="text-2xl font-display font-medium text-foreground mt-2">
        {name}
      </h1>

      {(rating || reviews) && (
        <div className="flex items-center gap-1.5 mt-2">
          <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
          <span className="text-xs text-foreground">{rating}</span>
          <span className="text-xs text-muted-foreground">({reviews} reviews)</span>
        </div>
      )}

      <div className="flex items-baseline gap-3 mt-4">
        <span className="text-2xl font-semibold text-foreground">
          {formatKES(displayPrice)}
        </span>
        {originalPrice && (
          <>
            <span className="text-base text-muted-foreground line-through">
              {formatKES(originalPrice)}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-accent bg-red-50 px-2 py-1 rounded">
              {discount}% off
            </span>
          </>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed mt-5">
          {description}
        </p>
      )}
    </div>
  );
};

export default ProductInfo;
