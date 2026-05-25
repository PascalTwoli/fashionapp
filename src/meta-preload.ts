/**
 * Pre-load meta tags for social media crawlers
 * This runs immediately and sets up default meta tags that crawlers can see
 * Runs BEFORE React initializes to ensure crawlers see the tags
 */

// Get product data from URL if it's a product page
function getProductFromUrl(): { slug?: string; id?: string } | null {
  const path = window.location.pathname;
  const productMatch = path.match(/\/product\/([^/]+)/);
  
  if (productMatch) {
    const slugOrId = productMatch[1];
    return { slug: slugOrId };
  }
  return null;
}

// Update a meta tag and ensure it's in the head
function setMetaTag(
  name: string,
  content: string,
  isProperty: boolean = false
): void {
  const attribute = isProperty ? 'property' : 'name';
  
  // Remove existing tag if present
  let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  if (tag) {
    tag.remove();
  }
  
  // Create and add new tag
  tag = document.createElement('meta');
  tag.setAttribute(attribute, name);
  tag.setAttribute('content', content);
  document.head.insertBefore(tag, document.head.firstChild);
}

function setTitle(title: string): void {
  document.title = title;
}

// Initialize default product meta tags for crawler visibility
export function initializeMetaTagsForCrawlers(): void {
  const product = getProductFromUrl();
  
  if (product) {
    // Set basic meta tags that will be visible to crawlers
    // These will be updated by React later, but crawlers that hit the page
    // will see these immediate values instead of waiting for JavaScript
    
    setTitle('Loading...');
    setMetaTag('description', 'Loading product details...');
    
    // Open Graph tags
    setMetaTag('og:title', 'Loading...', true);
    setMetaTag('og:description', 'Loading product details...', true);
    setMetaTag('og:type', 'product', true);
    setMetaTag('og:image', '/public/fashionup-logo.png', true);
    setMetaTag('og:image:width', '1200', true);
    setMetaTag('og:image:height', '630', true);
    setMetaTag('og:site_name', 'FashionUp', true);
    setMetaTag('og:locale', 'en_KE', true);
    
    // Twitter tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:site', '@fashionup');
    setMetaTag('twitter:domain', 'fashionup.com');
  }
}

// Run immediately when this module loads
initializeMetaTagsForCrawlers();
