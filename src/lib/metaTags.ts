/**
 * Meta Tags Management for Social Previews
 * Handles dynamic Open Graph and Twitter meta tags for product sharing
 */

export interface ProductMetaData {
  title: string;
  description: string;
  image: string;
  url: string;
  price?: string;
  brand?: string;
}

/**
 * Update or create a meta tag
 */
const updateMetaTag = (name: string, content: string, property = false): void => {
  const attribute = property ? 'property' : 'name';
  let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
};

/**
 * Update Open Graph meta tags for social sharing
 */
export const updateOpenGraphTags = (data: ProductMetaData): void => {
  try {
    // Basic Open Graph tags
    updateMetaTag('og:title', data.title, true);
    updateMetaTag('og:description', data.description, true);
    updateMetaTag('og:image', data.image, true);
    updateMetaTag('og:url', data.url, true);
    updateMetaTag('og:type', 'product', true);

    // Additional Open Graph tags for ecommerce
    if (data.price) {
      updateMetaTag('og:price:amount', data.price, true);
      updateMetaTag('og:price:currency', 'KES', true);
    }

    if (data.brand) {
      updateMetaTag('og:brand', data.brand, true);
    }

    // Site name
    updateMetaTag('og:site_name', 'FashionUp', true);
  } catch (error) {
    console.error('[MetaTags] Failed to update Open Graph tags:', error);
  }
};

/**
 * Update Twitter/X meta tags for social sharing
 */
export const updateTwitterTags = (data: ProductMetaData): void => {
  try {
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', data.title);
    updateMetaTag('twitter:description', data.description);
    updateMetaTag('twitter:image', data.image);
    updateMetaTag('twitter:site', '@fashionup');
    updateMetaTag('twitter:creator', '@fashionup');
  } catch (error) {
    console.error('[MetaTags] Failed to update Twitter tags:', error);
  }
};

/**
 * Update page title
 */
export const updatePageTitle = (title: string): void => {
  try {
    document.title = title;

    // Also update the og:title meta tag
    updateMetaTag('og:title', title, true);
  } catch (error) {
    console.error('[MetaTags] Failed to update page title:', error);
  }
};

/**
 * Update all social preview meta tags at once
 */
export const updateProductMetaTags = (data: ProductMetaData): void => {
  updatePageTitle(data.title);
  updateOpenGraphTags(data);
  updateTwitterTags(data);
};

/**
 * Reset to default meta tags
 */
export const resetMetaTags = (): void => {
  try {
    document.title = 'FashionUp - Premium Fashion Ecommerce';

    updateMetaTag('og:title', 'FashionUp', true);
    updateMetaTag('og:description', 'Discover premium fashion at FashionUp', true);
    updateMetaTag('og:url', window.location.origin, true);
    updateMetaTag('og:type', 'website', true);

    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', 'FashionUp');
    updateMetaTag('twitter:description', 'Discover premium fashion at FashionUp');
  } catch (error) {
    console.error('[MetaTags] Failed to reset meta tags:', error);
  }
};

/**
 * Generate product description for meta tags
 * Keep it under 160 characters for optimal display
 */
export const generateProductDescription = (
  productName: string,
  category?: string,
  brand?: string,
): string => {
  const parts = [
    productName,
    category && `${category} from FashionUp`,
    brand && `by ${brand}`,
  ].filter(Boolean);

  return parts.join(' • ').substring(0, 160);
};
