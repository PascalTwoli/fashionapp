
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddToCartButtonProps {
  onAddToCart: () => void;
}

const AddToCartButton = ({ onAddToCart }: AddToCartButtonProps) => {
  return (
    <div className="px-4">
      <Button 
        onClick={onAddToCart}
        className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-full"
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        Add to Cart
      </Button>
    </div>
  );
};

export default AddToCartButton;
