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
  title?: string;
  text?: string;
  url?: string;
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
 * For mobile: returns null to use native Share API instead
 * For desktop: returns web.whatsapp.com URL
 */
export const generateWhatsAppLink = (url: string, productName: string, price: number, discountPrice?: number): string => {
  const displayPrice = discountPrice ? discountPrice : price;
  // Fallback to rich text format since intent previews are unreliable. Include product & app info!
  const text = `✨ *${productName}*\n💰 KES ${displayPrice.toLocaleString()}\n\nCheck out this product on *FashionUp* - your ultimate fashion shopping destination. Upgrade your wardrobe today!\n\n🛍️ Tap the link to shop:\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

/**
 * Initialize Facebook SDK on the page
 * Loads the official Facebook SDK for better share dialog and preview support
 */
export const initFacebookSDK = (): Promise<void> => {
  return new Promise((resolve) => {
    // Check if FB is already initialized
    if ((window as any).FB) {
      resolve();
      return;
    }

    // Load Facebook SDK
    (window as any).fbAsyncInit = function () {
      FB.init({
        appId: '1234567890', // Placeholder - will work without it for share dialog
        xfbml: true,
        version: 'v18.0',
      });
      resolve();
    };

    // Load the SDK script
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0';
    script.onload = () => {
      // SDK loaded, FB should be available
      if ((window as any).FB) {
        resolve();
      }
    };
    script.onerror = () => {
      resolve(); // Continue even if SDK fails to load
    };

    document.body.appendChild(script);
  });
};

/**
 * Share via Facebook using native Share Dialog
 * This properly fetches og:image and shows preview
 */
export const shareViaFacebook = async (url: string): Promise<boolean> => {
  try {
    await initFacebookSDK();
    
    const FB = (window as any).FB;
    if (!FB) {
      // Fallback to sharer.php if SDK not available
      openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&display=popup`, 'Facebook');
      return true;
    }

    return new Promise((resolve) => {
      FB.ui(
        {
          method: 'share',
          href: url,
          display: 'popup',
          hashtag: '#FashionUp',
        },
        (response: any) => {
          resolve(!!response);
        }
      );
    });
  } catch (error) {
    console.error('[ShareUtils] Facebook share failed:', error);
    return false;
  }
};

/**
 * Share via Facebook Feed Dialog (creates a more native-looking post)
 * Better formatting control and typically shows larger images in the timeline
 */
export const shareViaFacebookFeed = async (url: string, productName: string, productPrice: number): Promise<boolean> => {
  try {
    await initFacebookSDK();
    
    const FB = (window as any).FB;
    if (!FB) {
      return shareViaFacebook(url); // Fallback to Share Dialog
    }

    // Format the caption to include price for better visibility
    // Caption appears near the image, so include key product info there
    const formattedCaption = `${productName}\nKES ${productPrice?.toLocaleString?.() || productPrice}`;
    
    // Description provides additional context
    const formattedDescription = `Discover this amazing product on FashionUp. Shop now!`;

    return new Promise((resolve) => {
      FB.ui(
        {
          method: 'feed',
          link: url,
          caption: formattedCaption,
          description: formattedDescription,
          display: 'popup',
          redirect_uri: window.location.href,
          // The image will be automatically fetched from og:image meta tags (1200x630 for link posts)
        },
        (response: any) => {
          resolve(!!response?.post_id);
        }
      );
    });
  } catch (error) {
    console.error('[ShareUtils] Facebook Feed Dialog failed:', error);
    return shareViaFacebook(url); // Fallback to Share Dialog
  }
};

/**
 * Generate Facebook share link (legacy method for fallback)
 */
export const generateFacebookLink = (url: string): string => {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&display=popup`;
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
