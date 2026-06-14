# Premium Sharing System - Advanced Features Integration Guide

## Phase 2 & 3 Implementation Roadmap

### 1. QR CODE GENERATION

**Current Status**: Foundation prepared, ready for integration

**Implementation Path**:

```bash
# Install QR code library (choice of two)
npm install qrcode.react  # React component (simpler)
# OR
npm install qrcode  # Pure JS library
```

**React Component Example**:
```tsx
import QRCode from 'qrcode.react';

const qrRef = React.useRef();

const generateQRCode = () => {
  const canvas = qrRef.current?.querySelector('canvas');
  if (canvas) {
    const image = canvas.toDataURL('image/png');
    downloadQR(image);
  }
};

<QRCode 
  ref={qrRef}
  value={productUrl}
  size={256}
  level="H"
  includeMargin={true}
/>
```

**Usage in ShareProductSheet**:
- Hook into existing `handleQRCode()` function
- Generate QR code from `productUrl`
- Show in modal or download option
- Track with `trackShareEvent(..., 'qr_code', ...)`

**Database Fields Ready**:
- `share_events.platform` supports 'qr_code'
- `share_analytics.ts` has `trackShareEvent(..., 'qr_code', ...)`

---

### 2. REFERRAL LINK SYSTEM

**Current Status**: Architecture prepared

**Implementation**:

```typescript
// In ShareProductSheet or product sharing
const referralCode = await trackShareWithReferral(
  productId,
  productName,
  'whatsapp' // or any platform
);

// Referral link format
const referralUrl = `${productUrl}?ref=${referralCode}`;
```

**Backend URL Handling**:
```typescript
// In ProductDetail or at app entry point
React.useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const referralCode = params.get('ref');
  
  if (referralCode) {
    trackShareClick(referralCode, productId);
    // Optional: Show "Shared by" badge or discount
  }
}, []);
```

**Database**:
- `share_events.referral_code` - unique code per share
- `share_conversions` table tracks clicks and purchases from referrals
- View: `product_share_metrics` shows referral click rate

**Future Revenue**:
- Affiliate commissions based on `share_conversions`
- Influencer tracking via unique referral codes
- Viral bonus if product hits share threshold

---

### 3. APP DEEP LINKING (Future Mobile App)

**Current Architecture Supports**:

```
Web: fashionup.com/product/{slug}
iOS: fashionup://product/{slug}
Android: app.fashionup.net/product/{slug}
```

**Implementation When Building Mobile App**:

```typescript
// Universal link configuration
// In Firebase/App Config:
{
  "applinks": {
    "details": [
      {
        "appID": "com.fashionup.ios",
        "paths": ["/product/*"]
      }
    ]
  }
}

// In share link generation
const shareUrl = isPlatformMobile 
  ? `fashionup://product/${slug}`  // App URL
  : `${window.location.origin}/product/${slug}`;  // Web fallback
```

**Slug Resolution Already Implemented**:
- `useProductByIdOrSlug()` hook supports both UUID and slug lookups
- Deep linking works immediately when app has URL scheme configured

---

### 4. SOCIAL PREVIEW ENHANCEMENT

**Current**: Basic OG tags + Schema.org

**To Improve**:

```typescript
// Enhance image handling for social platforms
const optimizeImageForSocial = (imageUrl: string) => {
  // Facebook recommends: 1200x630px
  // Twitter: 1200x675px
  // Pinterest: 1000x1500px (portrait)
  return `${imageUrl}?w=1200&h=630&fit=cover`;
};

// Add to metaTags
updateMetaTag('og:image:width', '1200', true);
updateMetaTag('og:image:height', '630', true);
```

**Server-Side Rendering (SSR) Notes**:
- Current: Client-side meta tag injection (works for social crawlers after JS execution)
- For Instant Preview: Consider adding server-side rendering or prerendering
- Alternative: Use services like metatags.io for dynamic preview generation

---

### 5. ANALYTICS DASHBOARD

**Current Data Collected**:
- Share events (platform, user, time)
- Conversion clicks (referral tracking)
- Product metrics (total shares, platform breakdown)

**Next Steps - Create Admin Dashboard Page**:

```typescript
// pages/AdminAnalytics.tsx
const mostSharedProducts = await supabase
  .from('product_share_metrics')
  .select('*')
  .order('total_shares', { ascending: false })
  .limit(10);

// Display metrics:
// - Total shares by platform
// - Trending products
// - Viral coefficient (shares per click)
// - Referral conversion rate
// - Top sharers (if tracking user_id)
```

**Tracked Metrics (in Database View)**:
- `total_shares` - Sum of all shares
- `platforms_used` - Distinct platforms
- `unique_sharers` - Count of different users
- `referral_clicks` - Visits from shared links
- `referral_click_rate` - Conversion percentage

---

### 6. EMAIL SHARING

**Not Yet Implemented**:

```typescript
// Add to ShareProductSheet
const handleEmailShare = async () => {
  const subject = encodeURIComponent(`Check out: ${productName}`);
  const body = encodeURIComponent(
    `Hey! I found this amazing product on FashionUp:\n\n${productName}\nKES ${price}\n\n${productUrl}`
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
  
  await trackShareEvent({
    productId,
    productName,
    platform: 'email',
    timestamp: Date.now(),
  });
};
```

---

### 7. INFLUENCER/CREATOR TOOLS

**Foundation Ready For**:

```typescript
// Generate creator link with tracking
const createInfluencerCode = (creatorId: string) => {
  const code = `CREATOR_${creatorId}_${Date.now()}`;
  // Store in creator_links table (to be created)
  return code;
};

// Track sales by influencer
const trackInfluencerSale = (creatorCode: string, orderId: string) => {
  // Create influencer_sales table
  // Calculate commissions
};
```

**Features for Future**:
- Creator dashboard showing referral stats
- Commission calculations
- Payout tracking
- Branded referral links

---

### 8. BATCH EVENT UPLOAD TO SERVER

**Currently**: Events stored locally in localStorage

**Implement Periodic Upload**:

```typescript
// In App.tsx or main layout
React.useEffect(() => {
  // Upload events every 5 minutes or on page unload
  const interval = setInterval(async () => {
    const uploaded = await uploadShareEventsToServer(supabase);
    console.log('Uploaded', uploaded, 'events');
  }, 5 * 60 * 1000);

  // Upload on page close
  window.addEventListener('beforeunload', async () => {
    await uploadShareEventsToServer(supabase);
  });

  return () => clearInterval(interval);
}, []);
```

---

### 9. PRODUCT SCHEMA.ORG BREADCRUMBS

**Ready to Enhance**:

```typescript
// Add breadcrumb schema
const generateBreadcrumbSchema = (productName: string, category: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://fashionup.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": category,
      "item": `https://fashionup.com/categories?filter=${category}`
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": productName,
      "item": productUrl
    }
  ]
});
```

---

## Database Schema - Already Created

### Tables:
- ✅ `share_events` - All share actions
- ✅ `share_conversions` - Click-through tracking
- ✅ `product_share_metrics` - Aggregated view

### Ready for Creation:
- `creator_links` - Influencer referral codes
- `influencer_sales` - Commission tracking
- `share_analytics_daily` - Daily aggregates

---

## Testing Checklist

- [ ] QR code generates and scans correctly
- [ ] Referral links track clicks properly
- [ ] Email sharing works on all platforms
- [ ] Analytics dashboard displays correctly
- [ ] Conversion rates calculate accurately
- [ ] Batch upload sends events to server
- [ ] Social preview works on all platforms
- [ ] Deep links resolve to correct product
- [ ] Mobile share sheet functions properly
- [ ] Error handling shows user-friendly messages

---

## Performance Notes

- ✅ Lazy load QR code library (on first use)
- ✅ Batch analytics uploads (not real-time)
- ✅ LocalStorage cap at 100 events (prevent bloat)
- ✅ Indexed database queries for fast analytics
- ✅ Cache product share metrics (5 min TTL)

---

## SEO Benefits

1. **Organic Reach**: Product pages indexed by Google
2. **Rich Snippets**: Schema.org data shows in search results
3. **Social Sharing**: OG tags increase click-through rates
4. **Viral Tracking**: Know which products drive organic traffic
5. **Content Distribution**: Monitor sharing patterns

---

**Status**: Foundation 80% complete, ready for Phase 2 & 3 features
