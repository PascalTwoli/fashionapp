import React from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Copy, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WhatsAppSheetProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappUrl: string;
  message: string;
  openMode: "new_tab" | "same_tab";
  productName: string;
  productPrice: number;
  productImage?: string;
}

/**
 * Convert URLs in text to clickable links
 */
function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export default function WhatsAppSheet({
  isOpen,
  onClose,
  whatsappUrl,
  message,
  openMode,
  productName,
  productPrice,
  productImage,
}: WhatsAppSheetProps) {
  const { toast } = useToast();

  const handleOpenWhatsApp = () => {
    if (openMode === "same_tab") {
      window.location.href = whatsappUrl;
    } else {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
    onClose();
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: "Message copied!",
        description: "You can now paste it in WhatsApp",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Render into a portal at document.body to escape any stacking contexts
  return createPortal(
    <>
      {/* Backdrop - Higher z-index than navbar (z-40) and header (z-30) */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        style={{ animation: isOpen ? 'fadeIn 0.2s ease-out' : 'fadeOut 0.2s ease-out' }}
      />

      {/* Sheet - Higher z-index than backdrop */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[70] bg-background border-t border-border',
          'transition-transform duration-300 ease-out max-w-md mx-auto w-full',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{
          animation: isOpen ? 'slideUpSheet 0.3s ease-out' : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-display text-lg">Contact via WhatsApp</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Product Info */}
        <div className="px-6 py-6 space-y-3 border-b border-border">
          <div className="flex gap-4">
            {productImage && (
              <div className="w-20 h-24 overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={productImage}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-medium line-clamp-2">{productName}</h4>
              </div>
              <div>
                <p className="text-lg font-bold">
                  KES {productPrice.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Final price</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Preview */}
        <div className="px-6 py-6 border-b border-border">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Message Preview
          </p>
          <div className="bg-secondary/30 p-4 border border-border max-h-64 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {linkifyText(message)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            The message will be pre-filled when you open WhatsApp
          </p>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-6 space-y-3">
          <Button
            onClick={handleOpenWhatsApp}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open WhatsApp
          </Button>

          <Button
            onClick={handleCopyMessage}
            variant="outline"
            className="w-full h-12"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Message
          </Button>
        </div>

        {/* Swipe to close hint */}
        <div className="pb-6 text-center">
          <p className="text-xs text-muted-foreground">Swipe down to close</p>
        </div>
      </div>

      {/* Animation styles - EXACTLY like ShareProductSheet */}
      <style>{`
        @keyframes slideUpSheet {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </>,
    document.body
  );
}
