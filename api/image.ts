import { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';
import http from 'http';

/**
 * Image proxy endpoint for social media crawlers
 * Downloads product images from Supabase and serves them with proper headers
 * This ensures Facebook, WhatsApp, etc. can properly download and cache images
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }

    // Only allow Supabase Storage URLs
    if (!url.includes('supabase.co') || !url.includes('storage')) {
      return res.status(403).json({ error: 'Only Supabase Storage URLs allowed' });
    }

    console.log('[ImageProxy] Fetching image from:', url.substring(0, 50) + '...');

    // Fetch the image from Supabase
    const imageBuffer = await fetchImage(url);

    // Set headers for optimal social media crawling
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.length);
    
    // Cache for 24 hours
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    
    // CORS headers for crawlers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    
    // Image dimensions meta
    res.setHeader('X-Image-Width', '912');
    res.setHeader('X-Image-Height', '1146');

    console.log('[ImageProxy] Returning image, size:', imageBuffer.length);
    return res.status(200).send(imageBuffer);
  } catch (error) {
    console.error('[ImageProxy] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch image' });
  }
}

function fetchImage(urlString: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const makeRequest = urlString.startsWith('https') ? https : http;

    makeRequest
      .get(urlString, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            return fetchImage(redirectUrl).then(resolve).catch(reject);
          }
        }

        if (response.statusCode !== 200) {
          return reject(
            new Error(`Failed to fetch image: ${response.statusCode}`)
          );
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      })
      .on('error', reject);
  });
}
