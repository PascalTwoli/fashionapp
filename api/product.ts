import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('[ProductAPI] Supabase URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('[ProductAPI] Supabase Key:', supabaseKey ? 'SET' : 'MISSING');

let cachedHtml: string = '';

function escapeHtml(text: string): string {
  if (!text) return '';
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function generateProductSlug(productName: string): string {
  return productName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatImageUrl(image: string): string {
  if (!image) return '';
  
  // If image is a relative path or incomplete URL, make it absolute
  if (!image.startsWith('http')) {
    // If it's a Supabase storage path
    if (image.includes('storage') || image.includes('public')) {
      image = `https://aloberytextlgvwmivxg.supabase.co/storage/v1/object/public${image.startsWith('/') ? image : '/' + image}`;
    }
  }

  // Ensure we use the public access URL
  if (image.includes('supabase.co')) {
    if (!image.includes('/storage/v1/object/public/')) {
      image = image.replace('/object/', '/object/public/');
    }
  }
  
  return image;
}

function generateMetaTagsHTML(product: any, productUrl: string): string {
  const price = product.discount_price || product.price;
  const originalPrice = product.discount_price && product.discount_price < product.price
    ? product.price
    : undefined;
  
  // Get image URL and ensure it's absolute
  let image = product.images?.[0] || product.image_url || '';
  image = formatImageUrl(image);
  
  // Fallback to a default image if none provided
  if (!image) {
    image = 'https://aloberytextlgvwmivxg.supabase.co/storage/v1/object/public/products/default-product.png';
  }

  console.log('[ProductAPI] Using image URL:', image);

    // Reverting to original image URL without transformations, keeping 1:1 dummy aspect ratio tags
    // so copy-pasting gives the best possible view.
    const imageWidth = '1146';
    const imageHeight = '1146';

    return `    <meta property="og:title" content="${escapeHtml(product.name)}" />
    <meta property="og:description" content="${escapeHtml(product.name)} - KES ${price?.toLocaleString?.() || price} | FashionUp" />
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${productUrl}" />
    <meta property="og:site_name" content="FashionUp" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:url" content="${image}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="${imageWidth}" />
    <meta property="og:image:height" content="${imageHeight}" />
    <meta property="og:image:alt" content="${escapeHtml(product.name)}" />
    <meta property="og:video:secure_url" content="" />
    <meta property="og:video:type" content="" />
    <meta property="og:price:amount" content="${price}" />
    <meta property="og:price:currency" content="KES" />
    ${originalPrice ? `<meta property="og:price:standard_amount" content="${originalPrice}" />` : ''}
    <meta property="og:brand" content="${escapeHtml(product.brand || 'FashionUp')}" />
    <meta property="og:product:category" content="${escapeHtml(product.category || '')}" />
    <meta property="og:locale" content="en_KE" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@fashionup" />
    <meta name="twitter:title" content="${escapeHtml(product.name)}" />
    <meta name="twitter:description" content="KES ${price?.toLocaleString?.() || price} on FashionUp" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${escapeHtml(product.name)}" />
    <meta name="twitter:creator" content="@fashionup" />
    <meta name="twitter:domain" content="fashionup.com" />`;
}

async function resolveProduct(slugOrId: string) {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Try UUID first
    const { data: byId } = await supabase
      .from('products')
      .select('*')
      .eq('id', slugOrId)
      .single();

    if (byId) {
      return byId;
    }

    // Try slug lookup
    const { data: allProducts } = await supabase
      .from('products')
      .select('*')
      .limit(500);

    if (allProducts) {
      const product = allProducts.find(
        (p: any) => generateProductSlug(p.name) === slugOrId
      );
      if (product) {
        return product;
      }
    }

    return null;
  } catch (error) {
    console.error('[ProductAPI] Error resolving product:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only handle GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Missing product slug' });
  }

  console.log('[ProductAPI] Processing request for slug:', slug);

  try {
    // Resolve product from Supabase
    const product = await resolveProduct(slug);

    if (!product) {
      console.log('[ProductAPI] Product not found for slug:', slug);
      // Return the client-side app to let React Router handle it
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('[ProductAPI] Found product:', product.name);

    // Load base HTML from the static dist folder
    let html = cachedHtml;
    if (!html) {
      try {
        // For Vercel, the dist folder is available at the deployment root
        const response = await fetch(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host'] || req.headers.host}/index.html`);
        if (response.ok) {
          html = await response.text();
          cachedHtml = html;
        }
      } catch (error) {
        console.error('[ProductAPI] Error fetching index.html:', error);
        // Fallback: return minimal HTML structure
        html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FashionUp</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index-D25x0lgC.js"></script>
  </body>
</html>`;
      }
    }
    
    if (!html) {
      return res.status(500).json({ error: 'Failed to load HTML' });
    }

    // Generate product URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'fashionapp-tau.vercel.app';
    const productUrl = `${protocol}://${host}/product/${slug}`;

    console.log('[ProductAPI] Generating meta tags for URL:', productUrl);

    // Generate meta tags
    const metaTags = generateMetaTagsHTML(product, productUrl);

    // Remove any existing generic og/twitter meta tags to prevent duplicates that confuse scrapers like WhatsApp
    let cleanHtml = html.replace(/<meta\s+(?:property|name)=["'](?:og|twitter):[^"']+["']\s+content=["'][^"']*["']\s*\/?>/gi, '');
    cleanHtml = cleanHtml.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(product.name)} | FashionUp</title>`);

    // Inject meta tags into HTML
    const modifiedHtml = cleanHtml.replace('</head>', `${metaTags}\n  </head>`);

    // Set cache control headers - shorter cache for product pages so Facebook picks up changes
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    res.setHeader('Pragma', 'public');
    
    console.log('[ProductAPI] Returning HTML with meta tags');
    return res.status(200).send(modifiedHtml);
  } catch (error) {
    console.error('[ProductAPI] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
