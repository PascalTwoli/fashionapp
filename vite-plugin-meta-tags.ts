/**
 * Vite Plugin: Meta Tag Injection for Product Pages
 * Intercepts product page requests and injects Open Graph meta tags
 * Works for both development and production
 */

import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

let supabase: any = null;
const productCache = new Map();

function initSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
    }
  }
  return supabase;
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

async function resolveProduct(slugOrId: string) {
  // Check cache first
  if (productCache.has(slugOrId)) {
    return productCache.get(slugOrId);
  }

  const client = initSupabase();
  if (!client) return null;

  try {
    // Try UUID first
    const { data: byId } = await client
      .from('products')
      .select('*')
      .eq('id', slugOrId)
      .single();

    if (byId) {
      productCache.set(slugOrId, byId);
      return byId;
    }

    // Try slug lookup
    const { data: allProducts } = await client
      .from('products')
      .select('*')
      .limit(500);

    if (allProducts) {
      const product = allProducts.find(
        (p: any) => generateProductSlug(p.name) === slugOrId
      );
      if (product) {
        productCache.set(slugOrId, product);
        return product;
      }
    }

    return null;
  } catch (error) {
    console.error('[ViteMetaTagPlugin] Error resolving product:', error);
    return null;
  }
}

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

function generateMetaTagsHTML(product: any, url: string): string {
  const price = product.discount_price || product.price;
  const originalPrice = product.discount_price && product.discount_price < product.price
    ? product.price
    : undefined;
  const image = product.images?.[0] || product.image_url || '';

  return `    <meta property="og:title" content="${escapeHtml(product.name)}" />
    <meta property="og:description" content="${escapeHtml(product.name)} - KES ${price?.toLocaleString?.() || price} | FashionUp" />
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
    <meta property="og:product:category" content="${escapeHtml(product.category || '')}" />
    <meta property="og:site_name" content="FashionUp" />
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

export default function metaTagInjectionPlugin(): Plugin {
  return {
    name: 'meta-tag-injection',
    apply: 'serve',
    configResolved(config) {
      // Initialize Supabase when config is resolved
      initSupabase();
    },
    async transformIndexHtml(html, ctx) {
      const url = ctx.originalUrl || '';
      
      // Check if this is a product page request
      const productMatch = url.match(/\/product\/([^/?]+)/);
      if (!productMatch) {
        return html;
      }

      const slugOrId = productMatch[1];
      console.log(`[ViteMetaTagPlugin] Processing product page: ${slugOrId}`);

      try {
        const product = await resolveProduct(slugOrId);
        if (product) {
          const baseUrl = `${ctx.server?.config?.server?.https ? 'https' : 'http'}://${ctx.request?.headers?.host || 'localhost:5173'}`;
          const productUrl = `${baseUrl}/product/${slugOrId}`;
          const metaTags = generateMetaTagsHTML(product, productUrl);
          
          // Inject meta tags into HTML head
          return html.replace('</head>', `${metaTags}\n  </head>`);
        }
      } catch (error) {
        console.error('[ViteMetaTagPlugin] Error:', error);
      }

      return html;
    },
  };
}
