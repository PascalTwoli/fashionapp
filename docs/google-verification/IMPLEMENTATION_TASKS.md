# FashionUp Privacy & Compliance - Implementation Tasks

**Purpose:** All tasks that can be implemented by developers/AI agents without user confirmation  
**Target Completion:** 2-4 weeks  
**Priority:** Implement in order of priority levels

---

## QUICK SUMMARY

| Category | Tasks | Effort | Timeline |
|----------|-------|--------|----------|
| **🔴 Critical - Must Do** | 6 tasks | High | Week 1-2 |
| **🟡 High Priority** | 8 tasks | Medium | Week 2-3 |
| **🟠 Medium Priority** | 5 tasks | Low-Medium | Week 3-4 |
| **Total** | **19 tasks** | **~60 hours** | **4 weeks** |

---

## 🔴 CRITICAL PRIORITY (Week 1-2)

### Task 1: Update Privacy Policy with Confirmed Data
**Status:** Ready to implement  
**What:** Update Privacy Policy with confirmed information from ASSUMPTIONS_CHECKLIST.md  
**Changes Needed:**
- Data Center Location: eu-west-1 (Europe)
- Email Service: Google/Gmail custom SMTP
- Remove Firebase references (already partially done)
- Add note: Card payment processor TBD (not yet implemented)
- Add note: Backups not yet configured

**Implementation Steps:**
```bash
1. Replace all "Firebase Authentication" → "Supabase Authentication"
2. Update Section 1.2: Data Center Location to eu-west-1 (Ireland/Frankfurt)
3. Update Section 3.2 Email Service to Google/Gmail custom SMTP
4. Update Section 8.1: Backup Strategy section with "Not yet configured"
5. Add disclaimer about card payment processor (coming soon)
6. Add note: GDPR compliance is primary (data center in EU)
```

**Estimated Effort:** 1-2 hours  
**Owner:** Developer/AI Agent  
**File to Update:** `PRIVACY_POLICY.md`

---

### Task 2: Deploy Privacy Policy to Public URL
**Status:** Requires setup  
**What:** Make Privacy Policy accessible at a public URL  
**Options:**

**Option A: Create `/privacy` route (Recommended)**
```typescript
// src/pages/Privacy.tsx
import { useEffect } from 'react';

export default function PrivacyPolicy() {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-4xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">
        Last Updated: June 2026 | Effective Date: [deployment-date]
      </p>
      
      {/* Content from PRIVACY_POLICY.md */}
      <article className="prose prose-sm max-w-none">
        {/* Include full policy text here */}
      </article>
    </div>
  );
}
```

**Option B: Static HTML file**
```
public/privacy-policy.html
```

**Option C: Link to external hosting**
```
https://fashionup.com/privacy (custom domain)
https://pages.fashionup.com/privacy (subdomain)
```

**Also Update:**
- Add `/privacy` route to `App.tsx`
- Add Privacy Policy link to footer
- Add Privacy Policy link to Settings page
- Add Privacy Policy link to registration page

**Estimated Effort:** 2-3 hours  
**Owner:** Developer  
**Deliverable:** Privacy Policy accessible at public URL

---

### Task 3: Create & Deploy Terms of Service
**Status:** Requires writing  
**What:** Create comprehensive Terms of Service

**Template Structure:**
```
1. INTRODUCTION & ACCEPTANCE
   - Service description
   - Agreement binding statement

2. USER RESPONSIBILITIES
   - Account creation
   - Password security
   - Prohibited use
   - Seller obligations

3. SELLER TERMS
   - Product authenticity
   - Intellectual property
   - Content guidelines
   - Liability limitations

4. BUYER TERMS
   - Order acceptance
   - Payment obligations
   - Dispute resolution

5. INTELLECTUAL PROPERTY
   - FashionUp owns platform
   - User owns content (uploads)
   - License to FashionUp

6. LIMITATION OF LIABILITY
   - Disclaimers
   - No warranty
   - Cap on damages

7. PRIVACY & DATA PROTECTION
   - References Privacy Policy
   - Google API Services clause
   - GDPR/CCPA acknowledgment

8. DISPUTE RESOLUTION
   - Governing law (Kenya)
   - Jurisdiction (Kenya courts)
   - Arbitration clause (optional)

9. TERMINATION
   - Account suspension/deletion
   - Effect of termination

10. MODIFICATIONS
   - Right to update ToS
   - Notification procedure

11. CONTACT INFORMATION
   - Email: [support@fashionup.com]
   - Address: [FashionUp address]
```

**Key Section for Google Compliance:**
```
Google API Services User Data Policy Compliance:

FashionUp uses Google APIs in compliance with Google's API Services User Data Policy.
By using our service, you consent to FashionUp's use of Google user data only for 
the purposes disclosed in our Privacy Policy. Google user data is not sold or 
shared with unauthorized third parties. You may revoke access to your Google data 
at any time via Google Settings or FashionUp Settings.
```

**Implementation:**
1. Create `TERMS_OF_SERVICE.md`
2. Create `/terms` route in `App.tsx`
3. Create Terms page component
4. Add links in footer, settings, registration

**Estimated Effort:** 3-4 hours  
**Owner:** Developer/Legal Review  
**Deliverable:** Published Terms of Service

---

### Task 4: Implement Account Deletion Feature
**Status:** Needs implementation  
**What:** Allow users to delete their accounts and data

**Self-Service Deletion (In Settings):**
```typescript
// src/pages/AccountSettings/DeleteAccount.tsx
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DeleteAccount() {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!confirmed) return;
    
    setLoading(true);
    try {
      // Step 1: Mark account for deletion (soft delete)
      await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user.id);

      // Step 2: Anonymize personal data (but keep orders for 7 years)
      await supabase
        .from('profiles')
        .update({
          full_name: '[Deleted]',
          avatar_url: null,
          bio: null,
          username: `deleted_${Date.now()}`,
        })
        .eq('id', user.id);

      // Step 3: Delete wishlist, cart
      await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      // Step 4: Send confirmation email
      await sendDeletionConfirmationEmail(user.email);

      // Step 5: Log out and redirect
      await supabase.auth.signOut();
      
      toast.success('Account marked for deletion. Permanently deleted in 90 days.');
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Deleting your account is permanent. This action cannot be undone.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Delete Your Account</h3>
        
        <p className="text-sm text-muted-foreground">
          When you delete your account:
          • Your profile and personal information will be permanently removed
          • Your orders will be retained for 7 years (tax/legal requirement)
          • You will not be able to log in
          • This process takes 90 days to complete
        </p>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm">
            I understand and want to permanently delete my account
          </span>
        </label>

        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={!confirmed || loading}
        >
          {loading ? 'Deleting...' : 'Delete My Account'}
        </Button>
      </div>
    </div>
  );
}
```

**Admin Dashboard for Manual Requests:**
```typescript
// src/pages/AdminDashboard/DataRequests.tsx
// List all account deletion requests
// Allow admin to process/reject requests
// Log actions for audit trail
```

**Database Changes:**
```sql
-- Add deletion tracking columns
ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN deletion_requested_at TIMESTAMP;

-- Create deletion requests table
CREATE TABLE deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  requested_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- pending, approved, completed
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for tracking
CREATE INDEX idx_deletion_requests_status ON deletion_requests(status);
```

**Estimated Effort:** 4-6 hours  
**Owner:** Developer  
**Deliverable:** Self-service + admin account deletion

---

### Task 5: Implement Cookie Consent Banner
**Status:** Needs implementation  
**What:** Get user consent before setting localStorage/cookies

**Component Implementation:**
```typescript
// src/components/CookieConsent.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowConsent(false);
    // Re-initialize analytics, cart, wishlist
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    setShowConsent(false);
    // Clear non-essential cookies
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium mb-2">
            We use cookies to enhance your experience
          </p>
          <p className="text-xs text-muted-foreground">
            We use cookies for shopping cart, wishlist, and analytics.
            <a href="/privacy#cookies" className="underline ml-1">
              Learn more
            </a>
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
          >
            Reject All
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
          >
            Accept All
          </Button>
        </div>

        <button
          onClick={() => setShowConsent(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

**Usage in App.tsx:**
```typescript
import CookieConsent from '@/components/CookieConsent';

export default function App() {
  return (
    <>
      {/* ... other components ... */}
      <CookieConsent />
    </>
  );
}
```

**Estimated Effort:** 2-3 hours  
**Owner:** Developer  
**Deliverable:** Cookie consent banner

---

### Task 6: Add Security Headers to Vercel Config
**Status:** Needs configuration  
**What:** Add HTTPS, HSTS, CSP headers for security

**Update `vercel.json`:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://liifbjpwbhsnoxzcthqv.supabase.co https://accounts.google.com; frame-src https://accounts.google.com"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/product/:slug",
      "destination": "/api/product?slug=:slug"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Estimated Effort:** 1 hour  
**Owner:** Developer  
**Deliverable:** Security headers configured

---

## 🟡 HIGH PRIORITY (Week 2-3)

### Task 7: Add Privacy Controls to Settings Page
**Status:** Needs implementation  
**What:** Let users manage their privacy and data

**Create Settings Component:**
```typescript
// src/pages/Settings/PrivacySettings.tsx

Components Needed:
1. Connected Services Section
   - Show connected Google Drive account
   - Button to disconnect/switch account
   - Show when connected

2. Data Management Section
   - Download my data (export JSON/CSV)
   - Delete my account
   - View data collection summary

3. Communication Preferences
   - Opt out of marketing emails
   - Manage notification preferences

4. Access & Revocation
   - View active sessions
   - Sign out of other devices
   - Revoke third-party access
```

**Estimated Effort:** 3-4 hours  
**Owner:** Developer  
**Deliverable:** Privacy settings page

---

### Task 8: Implement Data Export (Download My Data)
**Status:** Needs implementation  
**What:** Allow users to download their data in machine-readable format

```typescript
// src/services/dataExport.ts

export async function exportUserData(userId: string) {
  // 1. Fetch all user data
  const [profile, orders, wishlist, products, addresses] = await Promise.all([
    fetchProfile(userId),
    fetchOrders(userId),
    fetchWishlist(userId),
    fetchSellerProducts(userId),
    fetchAddresses(userId)
  ]);

  // 2. Format as JSON
  const data = {
    exported_at: new Date().toISOString(),
    profile,
    orders,
    wishlist,
    products,
    addresses
  };

  // 3. Create downloadable file
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadFile(blob, `fashionup_data_${userId}.json`);
}
```

**Estimated Effort:** 2 hours  
**Owner:** Developer  
**Deliverable:** Data export functionality

---

### Task 9: Setup Supabase Backups Configuration
**Status:** Needs configuration  
**What:** Enable automatic backups in Supabase

**Steps:**
```
1. Go to Supabase Console → Settings → Backups
2. Check if backups are enabled
3. Configure:
   - Backup frequency: Daily (recommended)
   - Retention: 30 days
   - Backup location: Same as primary
4. Document in Privacy Policy
5. Create backup restoration procedure
```

**Estimated Effort:** 1-2 hours  
**Owner:** DevOps/Developer  
**Deliverable:** Backups enabled and documented

---

### Task 10: Create Admin Data Request Dashboard
**Status:** Needs implementation  
**What:** Process privacy/data requests through admin dashboard

**Features:**
- List all data access requests
- List all deletion requests
- List all data export requests
- Process & complete requests
- Send automated responses
- Log all actions

**Estimated Effort:** 4-5 hours  
**Owner:** Developer  
**Deliverable:** Admin dashboard for privacy requests

---

### Task 11: Implement Session Timeout
**Status:** Needs implementation  
**What:** Log users out after inactivity

```typescript
// src/hooks/useSessionTimeout.ts

export function useSessionTimeout(timeoutMinutes = 30) {
  const { logout } = useAuth();

  useEffect(() => {
    let timeout;
    let lastActivity = Date.now();

    const resetTimeout = () => {
      clearTimeout(timeout);
      lastActivity = Date.now();

      timeout = setTimeout(() => {
        logout();
        toast.info('Session expired due to inactivity');
      }, timeoutMinutes * 60 * 1000);
    };

    // Listen for user activity
    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keydown', resetTimeout);
    window.addEventListener('click', resetTimeout);

    resetTimeout(); // Start timeout on component mount

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
      window.removeEventListener('click', resetTimeout);
    };
  }, []);
}
```

**Estimated Effort:** 2-3 hours  
**Owner:** Developer  
**Deliverable:** Session timeout implemented

---

### Task 12: Add Rate Limiting to Auth Endpoints
**Status:** Needs implementation  
**What:** Prevent brute force attacks on login/register

```typescript
// Using Vercel's rate limiting or middleware

// Recommended: Use middleware library like express-rate-limit
// OR implement in Supabase edge functions
```

**Estimated Effort:** 2-3 hours  
**Owner:** Developer  
**Deliverable:** Rate limiting on auth endpoints

---

### Task 13: Create Google Cloud Console OAuth Consent Screen
**Status:** Needs configuration  
**What:** Update OAuth consent screen for Google verification

**Steps:**
```
1. Go to Google Cloud Console
2. Select your project
3. Go to APIs & Services → OAuth consent screen
4. Configure:
   - App name: FashionUp
   - User support email: support@fashionup.com
   - Developer contact: privacy@fashionup.com
   - App homepage: https://fashionup.vercel.app
   - Privacy policy URL: https://fashionup.vercel.app/privacy
   - Terms of service URL: https://fashionup.vercel.app/terms
   - Scope:
     * https://www.googleapis.com/auth/drive.readonly
5. Test with Google OAuth flow
```

**Estimated Effort:** 1-2 hours  
**Owner:** Developer/Admin  
**Deliverable:** OAuth consent screen configured

---

### Task 14: Create & Record Demo Video for Google
**Status:** Needs creation  
**What:** Show Google how FashionUp uses their Drive API

**Video Content (3-5 minutes):**
1. Show user login
2. Navigate to seller dashboard
3. Start creating product
4. Click "Select Image from Google Drive"
5. Show Google Drive picker opening
6. Select an image from Google Drive
7. Show image imported into product
8. Show image stored in FashionUp storage
9. Confirm original Google Drive file is unchanged
10. Show user can disconnect Google Drive anytime
11. Show Privacy Policy

**Recommended Platform:** YouTube (unlisted link)

**Estimated Effort:** 1-2 hours  
**Owner:** Product/Marketing  
**Deliverable:** Demo video link

---

## 🟠 MEDIUM PRIORITY (Week 3-4)

### Task 15: Implement Audit Logging
**Status:** Needs implementation  
**What:** Log all admin actions and sensitive data access

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action VARCHAR(255),
  table_name VARCHAR(255),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address INET
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

**Estimated Effort:** 3-4 hours  
**Owner:** Developer  
**Deliverable:** Audit logging system

---

### Task 16: Encrypt localStorage Google Tokens
**Status:** Needs implementation  
**What:** Encrypt Google Drive tokens stored in localStorage

```typescript
// Using TweetNaCl.js or libsodium
import { secretbox, utils } from 'tweetnacl';

export function encryptToken(token: string, key: Uint8Array) {
  const nonce = utils.randomBytes(secretbox.nonceLength);
  const encrypted = secretbox(
    utils.decodeUTF8(token),
    nonce,
    key
  );
  // Store nonce + encrypted data
}

export function decryptToken(encryptedData: string, key: Uint8Array) {
  // Decrypt and return token
}
```

**Estimated Effort:** 2-3 hours  
**Owner:** Developer  
**Deliverable:** Token encryption

---

### Task 17: Move Google Tokens to httpOnly Cookies
**Status:** Needs implementation  
**What:** Use secure cookies instead of localStorage for tokens

**Recommendation:** Create a backend endpoint that:
1. Receives the OAuth code
2. Exchanges for access token
3. Stores in httpOnly cookie
4. Returns success to frontend

**Estimated Effort:** 3-4 hours  
**Owner:** Backend Developer  
**Deliverable:** Secure token storage

---

### Task 18: Add Multi-Factor Authentication (MFA)
**Status:** Optional but recommended  
**What:** Optional MFA for admin/seller accounts

**Options:**
- TOTP (Time-based One-Time Password) - Google Authenticator
- SMS OTP
- Email verification

**Estimated Effort:** 4-6 hours  
**Owner:** Developer  
**Deliverable:** MFA for sensitive accounts

---

### Task 19: Create Backup & Disaster Recovery Procedure
**Status:** Needs documentation  
**What:** Document how to restore from backups

**Procedure Document:**
```
1. When Backups Are Used
2. How to Initiate Restore
3. Restore Time Estimate
4. Testing Backup Restores
5. Communication to Users
```

**Estimated Effort:** 1-2 hours  
**Owner:** DevOps/Developer  
**Deliverable:** Disaster recovery procedure

---

## 🚀 Implementation Timeline

```
WEEK 1 (Critical)
□ Task 1: Update Privacy Policy - 2 hours
□ Task 2: Deploy Privacy Policy URL - 3 hours
□ Task 3: Create Terms of Service - 4 hours
□ Task 4: Account Deletion Feature - 6 hours
Total Week 1: ~15 hours

WEEK 2 (Critical + High)
□ Task 5: Cookie Consent Banner - 3 hours
□ Task 6: Security Headers - 1 hour
□ Task 7: Privacy Settings Page - 4 hours
□ Task 8: Data Export - 2 hours
□ Task 9: Supabase Backups - 2 hours
Total Week 2: ~12 hours

WEEK 3 (High + Medium)
□ Task 10: Admin Request Dashboard - 5 hours
□ Task 11: Session Timeout - 3 hours
□ Task 12: Rate Limiting - 3 hours
□ Task 13: Google OAuth Consent Screen - 2 hours
□ Task 14: Demo Video - 2 hours
□ Task 15: Audit Logging - 4 hours
Total Week 3: ~19 hours

WEEK 4 (Medium + Polish)
□ Task 16: Encrypt localStorage - 3 hours
□ Task 17: httpOnly Cookies - 4 hours
□ Task 18: MFA (Optional) - 6 hours
□ Task 19: Disaster Recovery Proc - 2 hours
□ Testing & Bug Fixes - 5 hours
Total Week 4: ~20 hours

TOTAL: ~66 hours (~2 developers, 2-3 weeks)
```

---

## Priority for Google Verification

**MUST COMPLETE:**
1. ✅ Task 1: Update Privacy Policy
2. ✅ Task 2: Deploy Privacy Policy URL
3. ✅ Task 3: Create Terms of Service
4. ✅ Task 13: Google OAuth Consent Screen
5. ✅ Task 14: Demo Video

**SHOULD COMPLETE:**
6. Task 7: Privacy Settings
7. Task 8: Data Export
8. Task 11: Session Timeout

**CAN COME LATER:**
9. Task 16-18: Enhanced security features

---

## Development Checklist

Use this to track implementation progress:

```
Week 1:
[ ] Privacy Policy updated (eu-west-1, Gmail SMTP)
[ ] Privacy Policy deployed to /privacy URL
[ ] Terms of Service created and published
[ ] Account deletion self-service feature working

Week 2:
[ ] Cookie consent banner showing and working
[ ] Security headers added to Vercel config
[ ] Privacy Settings page visible in dashboard
[ ] Data export functionality working

Week 3:
[ ] Admin dashboard for requests built
[ ] Session timeout implemented
[ ] Rate limiting on auth endpoints
[ ] Google OAuth consent screen configured
[ ] Demo video recorded and uploaded
[ ] Audit logging system working

Week 4:
[ ] localStorage tokens encrypted
[ ] Tokens moved to httpOnly cookies (if applicable)
[ ] MFA implemented for admins
[ ] Disaster recovery procedure documented
[ ] All bugs fixed and tested

Google Verification Ready:
[ ] Privacy Policy public and complete
[ ] Terms of Service public
[ ] Demo video available
[ ] OAuth consent screen configured
[ ] All three documents signed off
```

---

**Questions about any task? These are all fully implementable without user confirmation.**

**Next Step:** Pick Task 1 and start implementing!
