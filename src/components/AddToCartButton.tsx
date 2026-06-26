import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';
import { useWhatsAppSettings } from '@/hooks/useWhatsAppSettings';

interface AddToCartButtonProps {
  onAddToCart: () => void;
  selectedColor?: string;
  selectedSize?: string;
  isNavbarVisible?: boolean;
  // WhatsApp integration props
  productName?: string;
  productPrice?: number;
  productLink?: string;
  productImage?: string;
  onWhatsAppClick?: () => void; // Callback to open WhatsApp sheet
}

const AddToCartButton = ({ 
  onAddToCart, 
  selectedColor, 
  selectedSize,
  isNavbarVisible = false,
  productName,
  productPrice,
  productLink,
  productImage,
  onWhatsAppClick,
}: AddToCartButtonProps) => {
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const { data: whatsAppSettings, isLoading: whatsAppLoading } = useWhatsAppSettings();
  
  // Determine button state based on selections
  const isColorSelected = !!selectedColor;
  const isSizeSelected = !!selectedSize;
  const isBothSelected = isColorSelected && isSizeSelected;
  
  // Button position: pushed up when navbar is visible, at bottom-0 otherwise
  const bottomPosition = isNavbarVisible ? 'bottom-16' : 'bottom-0';
  
  // Check if WhatsApp is actually enabled AND this location is enabled
  const whatsAppWillShow = !whatsAppLoading && 
    whatsAppSettings?.enabled === true && 
    whatsAppSettings?.locations?.includes('product_page') &&
    productName && 
    productPrice && 
    productLink;
  
  // Trigger WhatsApp button slide-in after 3 seconds when both are selected
  useEffect(() => {
    if (isBothSelected && whatsAppWillShow) {
      const timer = setTimeout(() => {
        setShowWhatsApp(true);
      }, 3000); // 3 second delay
      
      return () => clearTimeout(timer);
    } else {
      setShowWhatsApp(false);
    }
  }, [isBothSelected, whatsAppWillShow]);
  
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
            className="w-full h-12 bg-foreground/50 text-background/70 text-sm tracking-wider uppercase font-medium cursor-not-allowed"
          >
            Select size
          </Button>
        </div>
      );
    }
    // Completely hidden if neither color nor size selected
    return null;
  }

  // Ready: both color and size selected
  return (
    <div className={cn(
      "fixed left-0 right-0 px-4 py-3 bg-background/95 backdrop-blur-md border-t border-border z-40",
      "animate-in fade-in duration-200",
      "transition-all duration-300 ease-out",
      bottomPosition
    )}>
      {whatsAppWillShow ? (
        /* WITH WhatsApp: Flex container with drawer animation */
        <div className="relative flex overflow-hidden">
          {/* Add to Bag Button - shrinks when WhatsApp appears */}
          <div 
            className={cn(
              "transition-all duration-1000 ease-out",
              showWhatsApp ? "flex-[2]" : "flex-1"
            )}
          >
            <Button
              onClick={onAddToCart}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-sm tracking-wider uppercase font-medium transition-colors"
            >
              Add to bag
            </Button>
          </div>
          
          {/* WhatsApp Button - Slides in from right like a drawer */}
          <div 
            className={cn(
              "transition-all duration-1000 ease-out overflow-hidden",
              showWhatsApp ? "flex-1 ml-2 opacity-100" : "w-0 ml-0 opacity-0"
            )}
          >
            <Button
              onClick={onWhatsAppClick}
              variant="outline"
              className="w-full h-12 border-foreground hover:bg-foreground/10 whitespace-nowrap text-sm tracking-wider uppercase font-medium"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {whatsAppSettings?.buttonText || 'Chat'}
            </Button>
          </div>
        </div>
      ) : (
        /* WITHOUT WhatsApp: Simple full-width button, no flex, no animation, no empty space */
        <Button
          onClick={onAddToCart}
          className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-sm tracking-wider uppercase font-medium transition-colors"
        >
          Add to bag
        </Button>
      )}
    </div>
  );
};

export default AddToCartButton;
