# WhatsApp Integration - Phase 1 Implementation

## Overview
Phase 1 implements basic WhatsApp chat functionality allowing customers to inquire about products via WhatsApp. The implementation is lightweight and uses only the existing `admin_settings` table.

## Components Created

### 1. Database Migration
**File**: `supabase/migrations/20260620_whatsapp_settings.sql`

Adds the following settings to `admin_settings` table:
- `whatsapp_enabled` - Enable/disable WhatsApp chat (default: false)
- `whatsapp_number` - WhatsApp Business number (default: "254759981287")
- `whatsapp_button_text` - Button text (default: "Chat on WhatsApp")
- `whatsapp_open_mode` - Open behavior: "new_tab" or "same_tab" (default: "new_tab")
- `whatsapp_locations` - Where to show button: ["product_page", "quick_view", "wishlist", "search"]
- `whatsapp_message_template` - Pre-filled message with variables

**To Apply**: Run this migration via Supabase CLI or dashboard to insert the default settings.

### 2. WhatsApp Settings Hook
**File**: `src/hooks/useWhatsAppSettings.ts`

React Query hook that fetches WhatsApp settings from `admin_settings` table.
- Returns `WhatsAppSettings` interface with all configuration
- Includes default fallback values
- 5-minute cache (staleTime)
- No refetch on window focus for performance

### 3. WhatsApp Service
**File**: `src/lib/whatsappService.ts`

Utility functions for generating WhatsApp URLs:
- `fillWhatsAppTemplate()` - Replaces template variables with product data
- `generateWhatsAppUrl()` - Creates wa.me URL with encoded message
- `generateProductWhatsAppUrl()` - Complete URL generation

**Template Variables**:
- `{{product_name}}` - Product name
- `{{price}}` - Formatted price (KES X,XXX)
- `{{color}}` - Selected color
- `{{size}}` - Selected size
- `{{product_link}}` - Product URL

### 4. WhatsApp Button Component
**File**: `src/components/WhatsAppButton.tsx`

Reusable button component that:
- Conditionally renders based on `enabled` and `locations` settings
- Generates WhatsApp URL with product details
- Opens WhatsApp in new/same tab based on settings
- Supports multiple variants and sizes
- Shows MessageCircle icon (optional)

**Props**:
```typescript
{
  productName: string;
  price: number;
  productLink: string;
  color?: string;
  productSize?: string;
  location: "product_page" | "quick_view" | "wishlist" | "search" | "cart";
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
  className?: string;
  showIcon?: boolean;
}
```

### 5. Admin Settings Page
**File**: `src/pages/AdminSettingsWhatsApp.tsx`

Admin UI for configuring WhatsApp integration:
- Enable/disable toggle
- WhatsApp number input (with country code instructions)
- Button text customization
- Message template editor with variable hints
- Location checkboxes (where to show button)
- Open behavior selection (new tab vs same tab)
- Save functionality with dirty state detection

**Route**: `/admin/settings/whatsapp`

### 6. Integration Points

#### Product Detail Page (`src/pages/ProductDetail.tsx`)
- WhatsApp button added alongside "Add to Bag" button
- Shows only when both color and size are selected
- Passes product details to WhatsApp button

#### Add to Cart Button (`src/components/AddToCartButton.tsx`)
- Modified to support multiple buttons (Add to Bag + WhatsApp)
- Flex layout with gap-2
- WhatsApp button conditionally rendered based on props

#### Admin Dashboard (`src/pages/AdminDashboard.tsx`)
- Added "WhatsApp Chat" card in Settings tab
- Icon: MessageCircle
- Links to `/admin/settings/whatsapp`

#### App Routes (`src/App.tsx`)
- Added route: `/admin/settings/whatsapp`

## Testing Checklist

### Prerequisites
1. ✅ Apply database migration to Supabase
2. ✅ Ensure admin user is logged in

### Admin Settings
1. Navigate to `/admin` → Settings tab
2. Click "WhatsApp Chat" card
3. Verify settings page loads
4. Test enabling WhatsApp
5. Update WhatsApp number (e.g., 254712345678)
6. Customize button text (e.g., "Ask on WhatsApp")
7. Edit message template
8. Toggle location checkboxes
9. Switch open behavior
10. Save settings and verify success toast

### Product Page
1. Navigate to any product detail page
2. Select a color
3. Select a size
4. Verify WhatsApp button appears next to "Add to Bag"
5. Click WhatsApp button
6. Verify:
   - Opens WhatsApp (web.whatsapp.com or wa.me)
   - Message is pre-filled with correct product details
   - Variables are replaced (name, price, color, size, link)

### WhatsApp URL Format
Should look like:
```
https://wa.me/254759981287?text=Hello%20FashionUp%2C%0A%0AI%27m%20interested...
```

### Edge Cases
1. WhatsApp disabled → Button should not appear
2. Location not checked → Button should not appear on that page
3. No color/size selected → Button should not appear (Product Page)
4. Different products → Correct details for each product

## Future Phases (Not Implemented)

### Phase 2: Order via WhatsApp
- Cart via WhatsApp
- Share order summary

### Phase 3: Multi-seller
- Seller-specific WhatsApp numbers
- Per-seller chat routing

### Phase 4: WhatsApp Business API
- Automated replies
- Order tracking through WhatsApp
- AI chatbot integration

## Files Modified

1. `src/App.tsx` - Added route and import
2. `src/pages/AdminDashboard.tsx` - Added settings card and icon import
3. `src/pages/ProductDetail.tsx` - Added WhatsApp button import and props
4. `src/components/AddToCartButton.tsx` - Support for multiple buttons

## Files Created

1. `src/hooks/useWhatsAppSettings.ts`
2. `src/lib/whatsappService.ts`
3. `src/components/WhatsAppButton.tsx`
4. `src/pages/AdminSettingsWhatsApp.tsx`
5. `supabase/migrations/20260620_whatsapp_settings.sql`
6. `docs/guides/WHATSAPP_INTEGRATION_PHASE1.md` (this file)

## Build Status
✅ Build successful (no TypeScript errors)
✅ No diagnostics errors
✅ All imports resolved

## Next Steps

1. Apply the migration to your Supabase database
2. Test the admin settings page
3. Test WhatsApp button on product pages
4. Verify WhatsApp URLs are correct
5. Test with actual WhatsApp number
6. Once confirmed working, commit and push changes
