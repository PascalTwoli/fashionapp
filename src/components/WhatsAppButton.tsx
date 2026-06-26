import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWhatsAppSettings } from "@/hooks/useWhatsAppSettings";
import { generateProductWhatsAppUrl, fillWhatsAppTemplate } from "@/lib/whatsappService";
import WhatsAppSheet from "@/components/WhatsAppSheet";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  productName: string;
  price: number;
  productLink: string;
  productImage?: string;
  color?: string;
  productSize?: string;
  location: "product_page" | "quick_view" | "wishlist" | "search" | "cart";
  variant?: "default" | "outline" | "ghost" | "secondary";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
  className?: string;
  showIcon?: boolean;
}

/**
 * WhatsApp button component that opens a modal with WhatsApp options
 * Conditionally renders based on admin settings (enabled status and location)
 */
export default function WhatsAppButton({
  productName,
  price,
  productLink,
  productImage,
  color,
  productSize,
  location,
  variant = "outline",
  buttonSize = "default",
  fullWidth = false,
  className,
  showIcon = true,
}: WhatsAppButtonProps) {
  const { data: settings, isLoading } = useWhatsAppSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Don't render while loading
  if (isLoading) return null;

  // Don't render if WhatsApp is disabled
  if (!settings?.enabled) return null;

  // Don't render if this location is not enabled
  if (!settings.locations.includes(location)) return null;

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const whatsappUrl = generateProductWhatsAppUrl(
    settings.number,
    settings.template,
    {
      productName,
      price,
      color,
      size: productSize,
      productLink,
    }
  );

  const message = fillWhatsAppTemplate(settings.template, {
    productName,
    price,
    color,
    size: productSize,
    productLink,
  });

  return (
    <>
      <Button
        variant={variant}
        size={buttonSize}
        onClick={handleClick}
        className={cn(
          fullWidth && "w-full",
          className
        )}
        type="button"
      >
        {showIcon && <MessageCircle className="w-4 h-4 mr-2" />}
        {settings.buttonText}
      </Button>

      <WhatsAppSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        whatsappUrl={whatsappUrl}
        message={message}
        openMode={settings.openMode}
        productName={productName}
        productPrice={price}
        productImage={productImage}
      />
    </>
  );
}
