# FashionUp - Minimal Confirmation Checklist

**Purpose:** Only essential items that REQUIRE USER INPUT (cannot be automated)  
**Total Items:** 8 critical confirmations  
**Timeline:** Can be completed as-is, others optional

---

## ✅ ALREADY CONFIRMED

From your ASSUMPTIONS_CHECKLIST updates:
- ✅ Data Center Location: **eu-west-1** (Europe)
- ✅ Email Service: **Google/Gmail custom SMTP**
- ✅ Card Payment Processor: **Not yet implemented** (M-Pesa only, for now)
- ✅ Backups: **Not yet configured** (can add later)

---

## 🔴 ITEMS THAT REQUIRE YOUR CONFIRMATION

### 1. **Support Email Address**
**Status:** REQUIRED for Google verification  
**Current Assumption:** privacy@fashionup.com  

**Confirmation:**
```
[ ] Email is: ____fashionup.ex@gmail.com____

[ ] Email is actively monitored by: ____________admin________________

[ ] Response time commitment: 
    [ ] 24 hours  [✅] 48 hours  [ ] 5 business days
```

**Impact:** This email will be used by Google and users for privacy requests.

---

### 2. **Payment Data Retention Requirement**
**Status:** REQUIRED (legal/tax compliance)  
**Current Assumption:** 7 years  

**Confirmation:**
```
[ ] Kenya tax authority requires retention for: _7__ years

Source: [] Finance team  [ ] Accountant  [ ] __Assumption only (pending accountant confirmation)

Confirmation contact: _____________N/A_______________
```

**Impact:** Determines how long order/payment records are kept.

---

### 3. **Website Domain**
**Status:** REQUIRED for OAuth configuration  
**Current Assumption:** https://fashionup.vercel.app  

**Confirmation:**
```
[ ] Primary domain: ____________ https://fashionup.vercel________________

[ ] Do you have a custom domain? 
    [ ] Yes: ____________________________
    [✅] No

[ ] Is domain HTTPS only?
    [✅] Yes
    [ ] No - needs to be fixed
```

**Impact:** Must match exactly in Google Cloud Console redirect URI.

---

### 4. **Company/Business Address**
**Status:** REQUIRED for Privacy Policy  
**Current:** [FashionUp Headquarters Address]  

**Confirmation:**
```
[ ] Company name: _____________FashionUp_______________

[ ] Business address:
    Street: _____________Business address available upon request_______________
    City: ______________Nairobi______________
    Region/County: ____________Nairobi________________
    Country: Kenya
    Postal Code: _____________00100_______________

[ ] Mailing address (if different): ____________________________
```

**Impact:** Required in Privacy Policy and Terms of Service.

---

### 5. **Primary Contact Person**
**Status:** REQUIRED for Google and legal purposes  

**Confirmation:**
```
[ ] Name: __________Pascal Twoli__________________

[ ] Title: _____________Founder & Platform Administrator_______________

[ ] Email: ______________fashionup.ex@gmail.com______________

[ ] Phone: ______________+254119249141______________

[ ] This person is responsible for:
    [ ] Privacy/legal matters
    [ ] Responding to data requests
    [ ] Google verification contact
```

**Impact:** Google may contact this person during verification.

---

### 6. **Google Cloud Project Details**
**Status:** REQUIRED for OAuth setup  
**Scope:** Only `drive.readonly` for image selection (minimal permissions)

**Confirmation:**
```
[ ] Google Cloud Project ID: _____________fashionup-495622_______________

[ ] Google Cloud Project Name: _____________FashionUp_______________

[ ] OAuth 2.0 Client ID: ____________727533117764-ctfjce0nbos3e0of2gd84pocd844f58v.apps.googleusercontent.com________________

[ ] OAuth Redirect URI(s):
    [ ] https://fashionup.vercel.app/auth/google-callback
    [ ] Others: ____________________________

[ ] Requested Scope: https://www.googleapis.com/auth/drive.readonly
    (Read-only access for image selection from Google Drive)
```

**Impact:** Needed to configure OAuth consent screen.

---

### 7. **Data Retention Policy for Deleted Accounts**
**Status:** OPTIONAL (but recommended)  

**Confirmation:**
```
[ ] After account deletion:
    
    [ ] Immediately delete all personal data
    [✅] Soft delete for 30 days, then permanently delete
    [ ] Soft delete for 90 days, then permanently delete
    [ ] Custom: ____________________________

[ ] Order/payment data:
    [✅ ] Delete after [__7___] years
    [ ] Keep indefinitely for records
    [ ] Anonymize after [_____] years

[ ] Wishlist/cart data:
    [ ] Delete immediately
    [ ✅] Delete after [__30___] days
    [ ] Keep indefinitely
```

**Impact:** Affects Privacy Policy and deletion implementation.

---

### 8. **Intended Target Audience/Jurisdiction**
**Status:** OPTIONAL (for compliance scope)  

**Confirmation:**
```
[ ] Primary target users:
    [ ] Kenya only
    [ ✅] East Africa (Kenya, Tanzania, Uganda, etc.)
    [ ] Africa
    [ ] Global

[ ] Are you targeting EU users?
    [ ] Yes - GDPR applies
    [✅ ] No - GDPR optional

[ ] Are you targeting California users?
    [ ] Yes - CCPA applies
    [✅ ] No - CCPA optional

[ ] Are you targeting any other regulated regions?
    [ ] Yes: ____________________________
    [✅ ] No
```

**Impact:** Determines which compliance frameworks apply.

---

## 🟡 ITEMS THAT CAN WAIT (Not blocking)

These CAN be implemented later without affecting Google verification:

```
[ ] Multi-factor authentication (MFA)
[ ] Advanced backup strategy
[ ] Audit logging
[ ] Enhanced security certifications
[ ] Data Processing Agreements (can be signed anytime)
```

---

## 📋 HOW TO COMPLETE THIS CHECKLIST

1. **Print this document**
2. **Fill in each section** with your information
3. **Share back with development team**
4. **Development team uses this to update:**
   - Privacy Policy
   - Terms of Service
   - Google OAuth Consent Screen
   - Implementation tasks

---

## ⏰ ESTIMATED COMPLETION TIME

**Time to fill this out:** 15-30 minutes  
**Difficulty:** Easy - just gathering known information  
**Who should fill it:** Business owner or legal contact

---

## ✨ WHAT HAPPENS AFTER YOU FILL THIS OUT

1. ✅ Privacy Policy automatically updated with your info
2. ✅ Terms of Service generated
3. ✅ Google OAuth Consent Screen ready to configure
4. ✅ Ready for Google verification within 2 weeks
5. ✅ Ready for production launch

---

## 📞 NEED HELP?

If you don't know an answer:

- **Support Email:** Ask your technical team
- **Domain/Address:** Contact your company admin
- **Tax Retention:** Ask your accountant
- **Google Project ID:** Log into Google Cloud Console
- **Target Audience:** It's a business decision - you decide

---

**Once completed, share this file and we can move forward with implementation! 🚀**
