/**
 * WhatsApp Integration Service
 * Generates WhatsApp URLs with pre-filled messages for product inquiries
 */

export interface WhatsAppMessageParams {
  productName: string;
  price: number;
  color?: string;
  size?: string;
  productLink: string;
}

/**
 * Replace template variables in WhatsApp message template
 */
export function fillWhatsAppTemplate(
  template: string,
  params: WhatsAppMessageParams
): string {
  const price = `KES ${params.price.toLocaleString()}`;
  
  return template
    .replace(/\{\{product_name\}\}/g, params.productName)
    .replace(/\{\{price\}\}/g, price)
    .replace(/\{\{color\}\}/g, params.color || "N/A")
    .replace(/\{\{size\}\}/g, params.size || "N/A")
    .replace(/\{\{product_link\}\}/g, params.productLink);
}

/**
 * Generate WhatsApp URL with pre-filled message
 * @param number WhatsApp number (with country code, no + sign)
 * @param message Pre-filled message text
 * @returns WhatsApp URL
 */
export function generateWhatsAppUrl(number: string, message: string): string {
  // Clean the number (remove spaces, dashes, plus signs)
  const cleanNumber = number.replace(/[\s\-\+]/g, "");
  
  // URL encode the message
  const encodedMessage = encodeURIComponent(message);
  
  // Return wa.me URL format
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}

/**
 * Generate complete WhatsApp inquiry URL for a product
 */
export function generateProductWhatsAppUrl(
  number: string,
  template: string,
  params: WhatsAppMessageParams
): string {
  const message = fillWhatsAppTemplate(template, params);
  return generateWhatsAppUrl(number, message);
}
