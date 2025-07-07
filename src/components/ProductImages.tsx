
import React from 'react';

interface ProductImagesProps {
  images: string[];
  productName: string;
  currentImageIndex: number;
  onImageChange: (index: number) => void;
}

const ProductImages = ({ images, productName, currentImageIndex, onImageChange }: ProductImagesProps) => {
  return (
    <div className="relative">
      <img 
        src={images[currentImageIndex]} 
        alt={productName}
        className="w-full h-80 object-cover"
      />
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => onImageChange(index)}
              className={`w-2 h-2 rounded-full ${
                currentImageIndex === index ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImages;
