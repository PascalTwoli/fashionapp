import React from 'react';
import { Button } from '@/components/ui/button';

interface AddToCartButtonProps {
  onAddToCart: () => void;
}

const AddToCartButton = ({ onAddToCart }: AddToCartButtonProps) => {
  return (
    <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-background/95 backdrop-blur-md border-t border-border z-40">
      <Button
        onClick={onAddToCart}
        className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none text-sm tracking-wider uppercase font-medium"
      >
        Add to bag
      </Button>
    </div>
  );
};

export default AddToCartButton;
