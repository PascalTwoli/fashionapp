/**
 * Share Analytics Tracking Foundation
 * Tracks sharing events for analytics, referral, and viral metrics
 */

export type SharePlatform = 
  | 'native'
  | 'copy_link'
  | 'whatsapp'
  | 'facebook'
  | 'twitter'
  | 'telegram'
  | 'pinterest'
  | 'qr_code'
  | 'email';

export interface ShareEvent {
  productId: string;
  productName: string;
  platform: SharePlatform;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  referralCode?: string;
}

export interface ShareMetrics {
  productId: string;
  totalShares: number;
  sharesByPlatform: Record<SharePlatform, number>;
  uniqueSharers: number;
  lastSharedAt: number;
  shareConversionRate?: number;
}

/**
 * Generate unique session ID for tracking
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate referral code for share tracking
 * Format: PROD_ID_TIMESTAMP_RANDOM
 */
export const generateReferralCode = (productId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `REF_${productId.substring(0, 8)}_${timestamp}_${random}`.toUpperCase();
};

/**
 * Get or create session ID from storage
 */
export const getOrCreateSessionId = (): string => {
  const storageKey = 'fashionup_session_id';
  let sessionId = sessionStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
};

/**
 * Track a share event
 * This should be called whenever a user shares a product
 */
export const trackShareEvent = async (
  event: ShareEvent,
): Promise<void> => {
  try {
    // Add session ID if not provided
    if (!event.sessionId) {
      event.sessionId = getOrCreateSessionId();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[ShareAnalytics]', {
        product: event.productName,
        platform: event.platform,
        time: new Date(event.timestamp).toISOString(),
      });
    }

    // Store event in localStorage for batch tracking
    const events = JSON.parse(localStorage.getItem('fashionup_share_events') || '[]');
    events.push(event);

    // Keep only last 100 events
    if (events.length > 100) {
      events.shift();
    }

    localStorage.setItem('fashionup_share_events', JSON.stringify(events));

    // TODO: Send to analytics backend (Supabase or external service)
    // await supabase.from('share_events').insert([event]);
  } catch (error) {
    console.error('[ShareAnalytics] Failed to track share event:', error);
  }
};

/**
 * Get pending share events for batch upload
 */
export const getPendingShareEvents = (): ShareEvent[] => {
  try {
    return JSON.parse(localStorage.getItem('fashionup_share_events') || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear tracked share events after batch upload
 */
export const clearShareEvents = (): void => {
  localStorage.removeItem('fashionup_share_events');
};

/**
 * Track share success with referral code
 */
export const trackShareWithReferral = async (
  productId: string,
  productName: string,
  platform: SharePlatform,
): Promise<string> => {
  const referralCode = generateReferralCode(productId);

  await trackShareEvent({
    productId,
    productName,
    platform,
    timestamp: Date.now(),
    referralCode,
  });

  return referralCode;
};

/**
 * Track share click (when someone visits from shared link with referral code)
 */
export const trackShareClick = (referralCode: string, productId: string): void => {
  try {
    const clicks = JSON.parse(localStorage.getItem('fashionup_share_clicks') || '{}');
    clicks[referralCode] = (clicks[referralCode] || 0) + 1;
    localStorage.setItem('fashionup_share_clicks', JSON.stringify(clicks));

    // Log analytics event
    if (window.gtag) {
      window.gtag('event', 'share_click', {
        referral_code: referralCode,
        product_id: productId,
      });
    }
  } catch (error) {
    console.error('[ShareAnalytics] Failed to track share click:', error);
  }
};

/**
 * Get share metrics for a product (from local events)
 */
export const getLocalShareMetrics = (productId: string): ShareMetrics => {
  const events = getPendingShareEvents().filter((e) => e.productId === productId);

  const sharesByPlatform: Record<SharePlatform, number> = {
    native: 0,
    copy_link: 0,
    whatsapp: 0,
    facebook: 0,
    twitter: 0,
    telegram: 0,
    pinterest: 0,
    qr_code: 0,
    email: 0,
  };

  const uniqueSharers = new Set<string>();

  events.forEach((event) => {
    sharesByPlatform[event.platform]++;
    if (event.userId) {
      uniqueSharers.add(event.userId);
    }
  });

  return {
    productId,
    totalShares: events.length,
    sharesByPlatform,
    uniqueSharers: uniqueSharers.size,
    lastSharedAt: events.length > 0 ? events[events.length - 1].timestamp : 0,
  };
};

/**
 * Format share metrics for display
 */
export const formatShareMetrics = (metrics: ShareMetrics): string => {
  if (metrics.totalShares === 0) return 'No shares yet';
  if (metrics.totalShares === 1) return '1 share';
  return `${metrics.totalShares} shares`;
};

/**
 * Hook function to batch upload events to server
 * Call this periodically or when app closes
 */
export const uploadShareEventsToServer = async (
  supabaseClient: any, // Supabase client instance
): Promise<number> => {
  try {
    const events = getPendingShareEvents();

    if (events.length === 0) {
      return 0;
    }

    const { error } = await supabaseClient.from('share_events').insert(events);

    if (error) {
      console.error('[ShareAnalytics] Failed to upload events:', error);
      return 0;
    }

    clearShareEvents();
    console.log('[ShareAnalytics] Uploaded', events.length, 'share events');
    return events.length;
  } catch (error) {
    console.error('[ShareAnalytics] Upload error:', error);
    return 0;
  }
};
