import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AddToCartButtonProps {
  onAddToCart: () => void;
  selectedColor?: string;
  selectedSize?: string;
  isNavbarVisible?: boolean;
}

const AddToCartButton = ({ 
  onAddToCart, 
  selectedColor, 
  selectedSize,
  isNavbarVisible = false
}: AddToCartButtonProps) => {
  // Determine button state based on selections
  const isColorSelected = !!selectedColor;
  const isSizeSelected = !!selectedSize;
  const isBothSelected = isColorSelected && isSizeSelected;
  
  // Button position: pushed up when navbar is visible, at bottom-0 otherwise
  const bottomPosition = isNavbarVisible ? 'bottom-16' : 'bottom-0';
  
  // Hidden: no color OR no size selected
  if (!isColorSelected || !isSizeSelected) {
    // Show disabled "SELECT SIZE" if color is selected but size is not
    if (isColorSelected && !isSizeSelected) {
      return (
        <div className={cn(
          "fixed left-0 right-0 px-4 py-3 bg-background/95 backdrop-blur-md border-t border-border z-40",
          "transition-all duration-300 ease-out",
          bottomPosition
        )}>
          <Button
            disabled
            className="w-full h-12 bg-foreground/50 text-background/70 rounded-none text-sm tracking-wider uppercase font-medium cursor-not-allowed"
          >
            Select size
          </Button>
        </div>
      );
    }
    // Completely hidden if neither color nor size selected
    return null;
  }

  // Ready: both color and size selected - show enabled "ADD TO BAG"
  return (
    <div className={cn(
      "fixed left-0 right-0 px-4 py-3 bg-background/95 backdrop-blur-md border-t border-border z-40",
      "animate-in fade-in duration-200",
      "transition-all duration-300 ease-out",
      bottomPosition
    )}>
      <Button
        onClick={onAddToCart}
        className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none text-sm tracking-wider uppercase font-medium transition-colors"
      >
        Add to bag
      </Button>
    </div>
  );
};

export default AddToCartButton;
