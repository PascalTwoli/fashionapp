import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  images?: string[] | null;
  image_url?: string;
  white_background_indices?: number[] | null;
  has_white_background?: boolean | null;
  price: number;
  discount_price?: number | null;
  status?: string;
}

interface RecommendationSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  variant?: 'horizontal' | 'grid';
}

/**
 * Premium recommendation sections with minimal product cards
 * - Desktop: grid layout
 * - Mobile: horizontal scroll (optional)
 * - Cards show: image, name, price, optional brand
 */
const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  title,
  subtitle,
  products,
  variant = 'grid',
}) => {
  const navigate = useNavigate();

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border pb-12">
      <div>
        {/* Section header */}
        <div className="mb-6 px-0 pt-12 lg:pt-24">
          <p className="text-eyebrow text-xs uppercase tracking-widest text-muted-foreground">
            {subtitle || title}
          </p>
          <h2 className="font-display text-xl mt-2">{title}</h2>
        </div>

        {/* Grid layout (desktop) or Horizontal scroll (mobile) */}
        {variant === 'grid' ? (
          // Grid - full width within parent constraint
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-2 sm:gap-x-3 gap-y-4 px-0">
            {products.map((product) => (
              <ProductRecommendationCard
                key={product.id}
                product={product}
                onProductClick={(id) => navigate(`/product/${id}`)}
              />
            ))}
          </div>
        ) : (
          // Horizontal scroll (mobile)
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-40 snap-start">
                <ProductRecommendationCard
                  product={product}
                  onProductClick={(id) => navigate(`/product/${id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

interface ProductRecommendationCardProps {
  product: Product;
  onProductClick: (id: string) => void;
}

const ProductRecommendationCard: React.FC<ProductRecommendationCardProps> = ({
  product,
  onProductClick,
}) => {
  // Get the white background image if available, otherwise use primary image
  let image: string | undefined;
  if (product.white_background_indices && product.white_background_indices.length > 0 && product.images) {
    const firstWhiteBgIndex = product.white_background_indices[0];
    image = product.images[firstWhiteBgIndex] || product.images[0] || product.image_url;
  } else {
    image = product.images?.[0] || product.image_url;
  }
  
  const hasDiscount =
    product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price - product.discount_price) / product.price) * 100,
      )
    : 0;

  return (
    <div
      onClick={() => onProductClick(product.id)}
      className="cursor-pointer group">
      {/* Image container - transparent background for white bg images to blend seamlessly */}
      <div className="relative mb-2 overflow-hidden bg-transparent aspect-[3/4]">
        {/* Image with hover zoom (desktop only) */}
        {image && (
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        )}


      </div>

      {/* Product info - center aligned */}
      <div className="space-y-1 text-center">
        {/* Name - truncated for compact display */}
        <h3 className="text-xs font-medium line-clamp-1 group-hover:text-foreground/80 transition-colors">
          {product.name}
        </h3>

        {/* Pricing */}
        <div className="flex items-baseline gap-1 pt-0.5 justify-center text-xs">
          <span className="font-medium">
            KES {product.discount_price?.toLocaleString() || product.price.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-muted-foreground line-through">
              KES {product.price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationSection;
