/**
 * Share utilities for product sharing with social media and deep linking
 */

export interface ShareData {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string;
  productSlug?: string;
}

/**
 * Generate product page URL for sharing
 * Using clean slug-based URL: /product/product-slug
 */
export const generateProductUrl = (slug: string, productId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/product/${slug || productId}`;
};

/**
 * Generate product slug from product name
 * Example: "Slitted Body Cone" => "slitted-body-cone"
 */
export const generateProductSlug = (productName: string): string => {
  return productName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Copy text to clipboard with promise-based API
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('[ShareUtils] Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Check if native Share API is supported
 */
export const isNativeShareSupported = (): boolean => {
  return typeof navigator !== 'undefined' && !!navigator.share;
};

/**
 * Use native Share API if available
 * Falls back gracefully if unsupported
 */
export const shareViaNavigator = async (shareData: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> => {
  if (!isNativeShareSupported()) {
    console.warn('[ShareUtils] Native Share API not supported');
    return false;
  }

  try {
    await navigator.share(shareData);
    return true;
  } catch (error: any) {
    // User dismissed share dialog (expected behavior)
    if (error.name === 'AbortError') {
      return false;
    }
    console.error('[ShareUtils] Share failed:', error);
    return false;
  }
};

/**
 * Generate WhatsApp share link
 */
export const generateWhatsAppLink = (url: string, productName: string, price: number, discountPrice?: number): string => {
  const displayPrice = discountPrice ? discountPrice : price;
  // Format: Product name and price on first line, URL on second line (WhatsApp recognizes this pattern better)
  const text = encodeURIComponent(
    `${productName}\nKES ${displayPrice.toLocaleString()}\n\n${url}`
  );
  return `https://wa.me/?text=${text}`;
};

/**
 * Generate Facebook share link
 */
export const generateFacebookLink = (url: string): string => {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
};

/**
 * Generate X/Twitter share link
 */
export const generateTwitterLink = (url: string, productName: string, price: number, discountPrice?: number): string => {
  const displayPrice = discountPrice ? discountPrice : price;
  const text = encodeURIComponent(
    `${productName} - KES ${displayPrice.toLocaleString()} on FashionUp\n${url}`
  );
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}&via=fashionup`;
};

/**
 * Generate Telegram share link
 */
export const generateTelegramLink = (url: string, productName: string, price: number, discountPrice?: number): string => {
  const displayPrice = discountPrice ? discountPrice : price;
  const text = encodeURIComponent(
    `${productName}\nKES ${displayPrice.toLocaleString()}\n\n${url}`
  );
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`;
};

/**
 * Generate Pinterest share link
 */
export const generatePinterestLink = (imageUrl: string, url: string, description: string): string => {
  const params = new URLSearchParams({
    url: encodeURIComponent(url),
    media: encodeURIComponent(imageUrl),
    description: encodeURIComponent(description),
  });
  return `https://pinterest.com/pin/create/button/?${params.toString()}`;
};

/**
 * Open social share link in new window
 */
export const openShareWindow = (url: string, platform: string): void => {
  const width = 600;
  const height = 400;
  const left = window.innerWidth / 2 - width / 2;
  const top = window.innerHeight / 2 - height / 2;

  window.open(
    url,
    `Share on ${platform}`,
    `width=${width},height=${height},left=${left},top=${top}`,
  );
};

/**
 * Format price for sharing
 */
export const formatPriceForShare = (price: number, discountPrice?: number): string => {
  if (discountPrice && discountPrice < price) {
    return `KES ${discountPrice.toLocaleString()} (was KES ${price.toLocaleString()})`;
  }
  return `KES ${price.toLocaleString()}`;
};
