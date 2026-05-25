import React, { useState } from 'react';
import { X, Copy, Share2, MessageCircle, Facebook, Heart, Send, AlertCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  copyToClipboard,
  isNativeShareSupported,
  shareViaNavigator,
  generateWhatsAppLink,
  generateFacebookLink,
  generateTwitterLink,
  generateTelegramLink,
  generatePinterestLink,
  openShareWindow,
} from '@/lib/shareUtils';
import {
  trackShareEvent,
  trackShareWithReferral,
  formatShareMetrics,
  getLocalShareMetrics,
  type SharePlatform,
} from '@/lib/shareAnalytics';
import { cn } from '@/lib/utils';

interface ShareProductSheetProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productPrice: number;
  discountPrice?: number;
  productImage: string;
  productUrl: string;
  productId: string;
}

const ShareProductSheet: React.FC<ShareProductSheetProps> = ({
  isOpen,
  onClose,
  productName,
  productPrice,
  discountPrice,
  productImage,
  productUrl,
  productId,
}) => {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasNativeShare = isNativeShareSupported();
  const shareMetrics = getLocalShareMetrics(productId);

  const handleCopyLink = async () => {
    try {
      setError(null);
      const success = await copyToClipboard(productUrl);
      if (success) {
        setIsCopied(true);

        // Track analytics
        await trackShareEvent({
          productId,
          productName,
          platform: 'copy_link',
          timestamp: Date.now(),
        });

        toast({
          title: 'Link copied',
          description: 'Product link copied to clipboard',
        });
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        throw new Error('Copy failed');
      }
    } catch (err) {
      setError('Failed to copy link. Please try again.');
      console.error('[ShareSheet] Copy error:', err);
    }
  };

  const handleNativeShare = async () => {
    try {
      setError(null);
      setIsSharing(true);
      const success = await shareViaNavigator({
        title: productName,
        text: `${productName} - KES ${discountPrice ? discountPrice.toLocaleString() : productPrice.toLocaleString()}`,
        url: productUrl,
      });
      setIsSharing(false);

      if (success) {
        // Track analytics
        await trackShareEvent({
          productId,
          productName,
          platform: 'native',
          timestamp: Date.now(),
        });

        toast({
          title: 'Shared!',
          description: 'Product shared successfully',
        });
        onClose();
      }
    } catch (err) {
      setIsSharing(false);
      setError('Share failed. Please try another method.');
      console.error('[ShareSheet] Share error:', err);
    }
  };

  const createTrackedLink = async (platform: SharePlatform, link: string) => {
    // Track share event with referral code
    const referralCode = await trackShareWithReferral(productId, productName, platform);
    // In future: append referral code to link
    return link;
  };

  const handleWhatsApp = async () => {
    try {
      setError(null);
      await createTrackedLink('whatsapp', '');
      const link = generateWhatsAppLink(productUrl, productName);
      openShareWindow(link, 'WhatsApp');
      onClose();
    } catch (err) {
      setError('Failed to share on WhatsApp');
    }
  };

  const handleFacebook = async () => {
    try {
      setError(null);
      await createTrackedLink('facebook', '');
      const link = generateFacebookLink(productUrl);
      openShareWindow(link, 'Facebook');
      onClose();
    } catch (err) {
      setError('Failed to share on Facebook');
    }
  };

  const handleTwitter = async () => {
    try {
      setError(null);
      await createTrackedLink('twitter', '');
      const link = generateTwitterLink(productUrl, productName);
      openShareWindow(link, 'X/Twitter');
      onClose();
    } catch (err) {
      setError('Failed to share on X/Twitter');
    }
  };

  const handleTelegram = async () => {
    try {
      setError(null);
      await createTrackedLink('telegram', '');
      const link = generateTelegramLink(productUrl, productName);
      openShareWindow(link, 'Telegram');
      onClose();
    } catch (err) {
      setError('Failed to share on Telegram');
    }
  };

  const handlePinterest = async () => {
    try {
      setError(null);
      await createTrackedLink('pinterest', '');
      const link = generatePinterestLink(productImage, productUrl, productName);
      openShareWindow(link, 'Pinterest');
      onClose();
    } catch (err) {
      setError('Failed to share on Pinterest');
    }
  };

  const handleQRCode = async () => {
    try {
      setError(null);
      // TODO: Generate QR code - can use qrcode.react library
      await trackShareEvent({
        productId,
        productName,
        platform: 'qr_code',
        timestamp: Date.now(),
      });
      toast({
        title: 'QR Code',
        description: 'QR code feature coming soon',
      });
    } catch (err) {
      setError('Failed to generate QR code');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        style={{ animation: isOpen ? 'fadeIn 0.2s ease-out' : 'fadeOut 0.2s ease-out' }}
      />

      {/* Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl border-t border-border',
          'transition-transform duration-300 ease-out max-w-md mx-auto w-full',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{
          animation: isOpen ? 'slideUpSheet 0.3s ease-out' : undefined,
        }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-display text-lg">Share Product</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-6 pt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Product Preview */}
        <div className="px-6 py-6 space-y-3 border-b border-border">
          <div className="flex gap-4">
            {/* Image thumbnail */}
            <div className="w-20 h-24 rounded overflow-hidden bg-muted flex-shrink-0">
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-medium line-clamp-2">{productName}</h4>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">
                  KES {discountPrice ? discountPrice.toLocaleString() : productPrice.toLocaleString()}
                </span>
                {discountPrice && discountPrice < productPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    KES {productPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Share Metrics */}
        {shareMetrics.totalShares > 0 && (
          <div className="px-6 py-3 border-b border-border bg-muted/30">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {formatShareMetrics(shareMetrics)}
            </p>
          </div>
        )}

        {/* Share Actions */}
        <div className="px-6 py-6 space-y-3">
          {/* Native Share - Primary if supported */}
          {hasNativeShare && (
            <Button
              onClick={handleNativeShare}
              disabled={isSharing}
              className="w-full h-11 rounded-none bg-foreground text-background hover:bg-foreground/90 flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" />
              {isSharing ? 'Sharing...' : 'Share via...'}
            </Button>
          )}

          {/* Copy Link - Always visible and prominent */}
          <Button
            onClick={handleCopyLink}
            variant={isCopied ? 'default' : 'outline'}
            className="w-full h-11 rounded-none flex items-center justify-center gap-2">
            <Copy className="w-4 h-4" />
            {isCopied ? 'Copied!' : 'Copy Link'}
          </Button>

          {/* Social Buttons Grid - Show if native share not supported or as additional options */}
          {!hasNativeShare && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                Share to
              </p>
              <div className="grid grid-cols-4 gap-2">
                {/* WhatsApp */}
                <button
                  onClick={handleWhatsApp}
                  disabled={isSharing}
                  className="aspect-square rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center group disabled:opacity-50"
                  aria-label="Share on WhatsApp"
                  title="WhatsApp">
                  <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                </button>

                {/* Facebook */}
                <button
                  onClick={handleFacebook}
                  disabled={isSharing}
                  className="aspect-square rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center group disabled:opacity-50"
                  aria-label="Share on Facebook"
                  title="Facebook">
                  <Facebook className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                </button>

                {/* Twitter/X */}
                <button
                  onClick={handleTwitter}
                  disabled={isSharing}
                  className="aspect-square rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center group disabled:opacity-50"
                  aria-label="Share on X"
                  title="X">
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-foreground"
                    fill="currentColor"
                    viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.672-5.829 6.672h-3.306l7.73-8.835L.424 2.25h6.679l4.882 6.479 5.259-6.479zM17.55 19.5h1.828L5.117 5.123H3.219l14.331 14.377z" />
                  </svg>
                </button>

                {/* Telegram */}
                <button
                  onClick={handleTelegram}
                  disabled={isSharing}
                  className="aspect-square rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center group disabled:opacity-50"
                  aria-label="Share on Telegram"
                  title="Telegram">
                  <Send className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                </button>

                {/* Pinterest */}
                <button
                  onClick={handlePinterest}
                  disabled={isSharing}
                  className="aspect-square rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center group disabled:opacity-50"
                  aria-label="Share on Pinterest"
                  title="Pinterest">
                  <Heart className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                </button>

                {/* QR Code */}
                <button
                  onClick={handleQRCode}
                  disabled={isSharing}
                  className="aspect-square rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center group disabled:opacity-50"
                  aria-label="Generate QR Code"
                  title="QR Code">
                  <QrCode className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Close hint for mobile */}
        <div className="px-6 py-3 text-center text-xs text-muted-foreground">
          Swipe down to close
        </div>

        {/* Animations */}
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
      </div>
    </>
  );
};
};

export default ShareProductSheet;
