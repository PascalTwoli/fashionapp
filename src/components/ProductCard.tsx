import React from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/contexts/WishlistContext';

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
  className,
}: ProductCardProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(id);
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const product = { id, name, brand, price, originalPrice, image, category };
    if (isWishlisted) removeFromWishlist(id);
    else addToWishlist(product);
  };

  return (
    <div
      className={cn('group cursor-pointer', className)}
      onClick={() => onProductClick(id)}
    >
      <div className="relative overflow-hidden bg-muted aspect-[3/4] hover-zoom">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover"
        />

        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-foreground text-background text-[10px] font-medium tracking-wider uppercase px-2 py-1">
            -{discount}%
          </span>
        )}

        <button
          onClick={handleWishlistToggle}
          aria-label="Toggle wishlist"
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          style={{ opacity: isWishlisted ? 1 : undefined }}
        >
          <Heart
            className={cn(
              'w-4 h-4',
              isWishlisted ? 'fill-accent text-accent' : 'text-foreground',
            )}
          />
        </button>
      </div>

      <div className="pt-3 pb-1">
        <p className="text-eyebrow">{brand}</p>
        <h3 className="text-sm font-medium text-foreground mt-1 line-clamp-1">
          {name}
        </h3>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-sm font-semibold text-foreground">
            ${price.toFixed(2)}
          </span>
          {originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
