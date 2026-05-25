/**
 * Server-side meta tag injection for social media crawlers
 * This handles product page requests and injects proper Open Graph meta tags
 * Must be served from a Node.js server or serverless function
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate product slug from name
 */
function generateProductSlug(productName: string): string {
  return productName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolve product by slug or UUID
 */
async function resolveProduct(slugOrId: string) {
  try {
    // Try UUID first
    const { data: byId } = await supabase
      .from('products')
      .select('*')
      .eq('id', slugOrId)
      .single();

    if (byId) return byId;

    // Try slug lookup - fetch all products and match by generated slug
    const { data: allProducts } = await supabase
      .from('products')
      .select('*')
      .limit(1000);

    if (allProducts) {
      const product = allProducts.find(
        (p) => generateProductSlug(p.name) === slugOrId
      );
      if (product) return product;
    }

    return null;
  } catch (error) {
    console.error('[MetaTagServer] Error resolving product:', error);
    return null;
  }
}

/**
 * Generate Open Graph meta tags HTML
 */
function generateMetaTagsHTML(product: any, url: string): string {
  const price = product.discount_price || product.price;
  const originalPrice = product.discount_price ? product.price : undefined;
  const image = product.images?.[0] || product.image_url || '/public/fashionup-logo.png';

  return `
    <meta property="og:title" content="${escapeHtml(product.name)}" />
    <meta property="og:description" content="${escapeHtml(product.name)} - KES ${price.toLocaleString()} | FashionUp Fashion Store" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(product.name)}" />
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${url}" />
    <meta property="og:price:amount" content="${price}" />
    <meta property="og:price:currency" content="KES" />
    ${originalPrice ? `<meta property="og:price:standard_amount" content="${originalPrice}" />` : ''}
    <meta property="og:brand" content="${escapeHtml(product.brand || 'FashionUp')}" />
    <meta property="og:product:category" content="${escapeHtml(product.category || 'Fashion')}" />
    <meta property="og:site_name" content="FashionUp" />
    <meta property="og:locale" content="en_KE" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@fashionup" />
    <meta name="twitter:title" content="${escapeHtml(product.name)}" />
    <meta name="twitter:description" content="KES ${price.toLocaleString()} - Shop on FashionUp" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${escapeHtml(product.name)}" />
    <meta name="twitter:creator" content="@fashionup" />
    <meta name="twitter:domain" content="fashionup.com" />
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "${escapeHtml(product.name)}",
      "description": "${escapeHtml(product.name)} - Premium fashion item",
      "image": "${image}",
      "brand": {
        "@type": "Brand",
        "name": "${escapeHtml(product.brand || 'FashionUp')}"
      },
      "offers": {
        "@type": "Offer",
        "price": "${price}",
        "priceCurrency": "KES",
        "availability": "https://schema.org/InStock",
        "url": "${url}"
      }${product.rating ? `,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "${product.rating}",
        "bestRating": "5",
        "worstRating": "1"
      }` : ''}
    }
    </script>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Inject meta tags into HTML
 */
function injectMetaTags(html: string, metaTags: string): string {
  return html.replace('</head>', `${metaTags}\n  </head>`);
}

/**
 * Handle product page request for social media crawlers
 * Usage: Call this from your server middleware/handler
 */
export async function handleProductPageRequest(
  slugOrId: string,
  baseUrl: string,
  originalHtml: string
): Promise<string> {
  try {
    const product = await resolveProduct(slugOrId);

    if (!product) {
      // Product not found, return original HTML
      return originalHtml;
    }

    const productUrl = `${baseUrl}/product/${slugOrId}`;
    const metaTagsHTML = generateMetaTagsHTML(product, productUrl);
    const modifiedHtml = injectMetaTags(originalHtml, metaTagsHTML);

    return modifiedHtml;
  } catch (error) {
    console.error('[MetaTagServer] Failed to process product page:', error);
    // Return original HTML on error
    return originalHtml;
  }
}

export { generateMetaTagsHTML, resolveProduct, escapeHtml };
