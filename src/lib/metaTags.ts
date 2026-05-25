/**
 * Meta Tags Management for Social Previews & SEO
 * Handles dynamic Open Graph, Twitter, and Schema.org structured data for product sharing
 */

export interface ProductMetaData {
  title: string;
  description: string;
  image: string;
  url: string;
  price?: string;
  originalPrice?: string;
  brand?: string;
  category?: string;
  productId?: string;
  rating?: number;
  reviews?: number;
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
 * Update or create a script tag for JSON-LD
 */
const updateJsonLdScript = (id: string, jsonData: object): void => {
  let script = document.getElementById(id) as HTMLScriptElement;

  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(jsonData);
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
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:image:alt', data.title, true);
    updateMetaTag('og:url', data.url, true);
    updateMetaTag('og:type', 'product', true);

    // Additional Open Graph tags for ecommerce
    if (data.price) {
      updateMetaTag('og:price:amount', data.price, true);
      updateMetaTag('og:price:currency', 'KES', true);
    }

    if (data.originalPrice) {
      updateMetaTag('og:price:standard_amount', data.originalPrice, true);
    }

    if (data.brand) {
      updateMetaTag('og:brand', data.brand, true);
    }

    if (data.category) {
      updateMetaTag('og:product:category', data.category, true);
    }

    // Site name
    updateMetaTag('og:site_name', 'FashionUp', true);

    // Locale
    updateMetaTag('og:locale', 'en_KE', true);
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
    updateMetaTag('twitter:image:alt', data.title);
    updateMetaTag('twitter:site', '@fashionup');
    updateMetaTag('twitter:creator', '@fashionup');
    updateMetaTag('twitter:domain', 'fashionup.com');
  } catch (error) {
    console.error('[MetaTags] Failed to update Twitter tags:', error);
  }
};

/**
 * Generate Schema.org Product structured data (JSON-LD)
 * Enables rich search results and better social preview
 */
export const generateProductSchema = (data: ProductMetaData): object => {
  const schema: any = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: data.title,
    description: data.description,
    image: data.image,
    brand: {
      '@type': 'Brand',
      name: data.brand || 'FashionUp',
    },
    url: data.url,
  };

  // Add pricing information
  if (data.price) {
    schema.offers = {
      '@type': 'Offer',
      url: data.url,
      priceCurrency: 'KES',
      price: data.price,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'FashionUp',
        url: 'https://fashionup.com',
      },
    };

    // Add discount if available
    if (data.originalPrice && parseInt(data.originalPrice) > parseInt(data.price)) {
      schema.offers.priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    }
  }

  // Add rating if available
  if (data.rating && data.reviews) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.rating.toFixed(1),
      ratingCount: data.reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Add product ID
  if (data.productId) {
    schema.sku = data.productId;
  }

  // Add category
  if (data.category) {
    schema.category = data.category;
  }

  return schema;
};

/**
 * Generate Schema.org Organization structured data
 */
export const generateOrganizationSchema = (): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FashionUp',
    url: 'https://fashionup.com',
    logo: 'https://fashionup.com/logo.png',
    description: 'Premium fashion ecommerce platform',
    sameAs: [
      'https://www.facebook.com/fashionup',
      'https://twitter.com/fashionup',
      'https://www.instagram.com/fashionup',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@fashionup.com',
    },
  };
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
 * Update all social preview meta tags and structured data at once
 */
export const updateProductMetaTags = (data: ProductMetaData): void => {
  updatePageTitle(data.title);
  updateOpenGraphTags(data);
  updateTwitterTags(data);

  // Add Schema.org structured data
  try {
    const productSchema = generateProductSchema(data);
    updateJsonLdScript('product-schema', productSchema);
  } catch (error) {
    console.error('[MetaTags] Failed to update product schema:', error);
  }
};

/**
 * Initialize organization schema (should be added once on app load)
 */
export const initializeOrganizationSchema = (): void => {
  try {
    const orgSchema = generateOrganizationSchema();
    updateJsonLdScript('organization-schema', orgSchema);
  } catch (error) {
    console.error('[MetaTags] Failed to initialize organization schema:', error);
  }
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
 * Generate optimized product description for meta tags
 * Keep it under 160 characters for optimal display in search results
 * Under 200 characters for social media
 */
export const generateProductDescription = (
  productName: string,
  category?: string,
  brand?: string,
  discount?: boolean,
): string => {
  let description = productName;

  // Add brand if available
  if (brand) {
    description += ` by ${brand}`;
  }

  // Add category if available
  if (category) {
    description += ` • ${category}`;
  }

  // Add discount indicator
  if (discount) {
    description += ' • On Sale';
  }

  // Add platform name
  description += ' • Shop at FashionUp';

  // Truncate to 160 characters for search results (can go to 200 for social)
  return description.substring(0, 160);
};

/**
 * Generate short description for social media (max 200 chars)
 */
export const generateShortDescription = (
  productName: string,
  price: string,
  discount?: boolean,
): string => {
  let desc = `${productName} - ${price}`;

  if (discount) {
    desc += ' • Limited offer!';
  }

  desc += ' Shop now';

  return desc.substring(0, 200);
};

/**
 * Validate that all required meta tags are present
 */
export const validateMetaTags = (): {
  valid: boolean;
  missing: string[];
} => {
  const required = [
    { name: 'og:title', property: true },
    { name: 'og:description', property: true },
    { name: 'og:image', property: true },
    { name: 'og:url', property: true },
    { name: 'twitter:card', property: false },
    { name: 'twitter:image', property: false },
  ];

  const missing: string[] = [];

  required.forEach(({ name, property }) => {
    const attribute = property ? 'property' : 'name';
    const tag = document.querySelector(`meta[${attribute}="${name}"]`);
    if (!tag || !tag.getAttribute('content')) {
      missing.push(name);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
  };
};

