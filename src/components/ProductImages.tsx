import React from 'react';
import { cn } from '@/lib/utils';

interface ProductImagesProps {
  images: string[];
  productName: string;
  currentImageIndex: number;
  onImageChange: (index: number) => void;
}

const ProductImages = ({
  images,
  productName,
  currentImageIndex,
  onImageChange,
}: ProductImagesProps) => {
  return (
    <div className="relative bg-muted lg:h-[calc(100vh-4rem)]">
      <div className="aspect-[3/4] lg:aspect-auto lg:h-full overflow-hidden">
        <img
          src={images[currentImageIndex]}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => onImageChange(index)}
              aria-label={`Image ${index + 1}`}
              className={cn(
                'h-1 transition-all',
                currentImageIndex === index
                  ? 'w-6 bg-foreground'
                  : 'w-3 bg-foreground/30',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImages;
