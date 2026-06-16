# Privacy Policy for FashionUp

**Last Updated:** June 2026  
**Effective Date:** June 11, 2026

---

## 1. Introduction

FashionUp ("we," "us," "our," or "Company") is committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit and use our website and services at [https://fashionup.vercel.app](https://fashionup.vercel.app) (the "Site").

This Privacy Policy is designed to:
- Explain what personal information we collect
- Describe how we use and protect that information
- Clarify your rights regarding your data
- Comply with applicable privacy laws and regulations
- Meet Google API Services User Data Policy requirements for Google Drive integration

**Please read this Privacy Policy carefully.** By accessing and using FashionUp, you acknowledge that you have read, understood, and agree to be bound by all the provisions of this Privacy Policy. If you do not agree with our policies and practices, please do not use our Site.

---

## 2. Definitions

- **"Personal Data"** or **"Personal Information"**: Any information that identifies, relates to, or could reasonably be linked with you as an individual.
- **"Google User Data"**: Information obtained from Google services about you or through your Google account, including your email address and Google Drive files you authorize us to access.
- **"Processing"**: Any operation performed on personal data, such as collection, storage, use, disclosure, or deletion.
- **"Data Controller"**: FashionUp, responsible for determining how and why personal data is processed.
- **"Data Processor"**: Third-party services that process personal data on our behalf (e.g., Supabase, Vercel).

---

## 3. Information We Collect

### 3.1 Information You Provide Directly

#### A. Account Registration & Authentication
When you create an account on FashionUp, we collect:
- **Full Name**
- **Email Address**
- **Password** (encrypted and handled by Supabase Authentication)
- **Account Type** (Customer or Administrator; independent seller accounts may be introduced in future platform versions)
- **Date and Time of Account Creation**
- **Profile Photo** (optional)

#### B. Google Sign-In & OAuth Authentication
When you choose to authenticate via Google Sign-In:
- Your Google Account email address
- Your Google Account profile information (name, profile picture)
- A unique Google identifier (Sub)
- Authentication tokens securely stored for future authentication

We use Supabase Authentication, which handles password security. We do not store your password directly in FashionUp's systems.

#### C. Profile & Account Information
After registration, you may provide:
- Username
- Profile photo and biographical information
- Contact information and communication preferences

#### D. Product Information (Administrator-Managed)
FashionUp administrators currently manage all product listings, including:
- Product names and descriptions
- Product categories
- Product pricing
- Product inventory levels
- Product images (uploaded directly or imported from Google Drive by administrators)
- Product variants (size, color, other attributes)

**Note:** Future versions of FashionUp may allow independent sellers to create accounts and manage their own product listings. This Privacy Policy will be updated accordingly when such functionality is introduced.

#### E. Customer Purchase Information
When you purchase products, we collect:
- First and last name
- Email address
- Phone number
- Delivery address (street address, city, county/region, postal code)
- Billing address (if different from delivery)
- Delivery instructions (optional)
- Order history and transaction records

#### F. Payment Information
When you complete a purchase, we collect:

- Payment method selected (currently M-Pesa; additional payment methods may be added in future releases)
- Payment reference numbers
- Payment status
- Transaction amounts and dates

**Important:** We do not directly collect or store full credit card numbers, card verification values (CVV), or complete card data. Payment processing is handled by our third-party payment processors (described in Section 8).

#### G. Communication Data
- Messages and support requests sent to our customer support team
- Email correspondence
- Feedback and reviews you submit
- Preferences for communications from FashionUp

### 3.2 Information Collected Automatically

#### A. Browser & Device Information
- Browser type and version
- Operating system
- Device type and model
- IP address
- Approximate geographic location (city/region level)
- Internet Service Provider (ISP)

#### B. Usage Data
- Pages visited and time spent on each page
- Links clicked
- Search queries
- Actions taken (add to cart, wishlist, checkout steps)
- Referral sources (how you arrived at our Site)
- Session duration and frequency

#### C. Local Storage & Cookies
We use browser storage for:
- **Shopping Cart Persistence**: Items you add to your cart are stored locally on your device using `localStorage`. This allows you to maintain your cart even if you close your browser (before checkout).
- **Wishlist Persistence**: Favorited items are stored locally using `localStorage`.
- **Session Management**: Authentication tokens and session information
- **OAuth State**: Temporary verification tokens during Google authentication (stored in `sessionStorage` and automatically cleared)

**Cookies & Similar Technologies:**

- Session cookies (cleared when browser closes)
- Preference cookies (to remember your settings)
- Authentication tokens (to keep you logged in)

**Third-party cookies** may be set by:

- Google for authentication and Drive access
- Payment processors (M-Pesa, card processors)
- Analytics services (if enabled)

#### D. Google Drive Information
When you authorize FashionUp to access your Google Drive:
- **Google Drive File Metadata**: File names, file IDs, creation dates, modification dates
- **Authorized Files Only**: Only files you explicitly select in the Google Drive picker
- **Email Address**: Associated with your Google account

### 3.3 Information from Third Parties

#### A. Authentication Providers
- Supabase Authentication provides user authentication and session management data
- Google OAuth provides identity verification for Google Drive access only

#### B. Payment Processors
- Transaction records and payment status from M-Pesa (Daraja) and card processors
- Payment success/failure notifications
- Transaction receipts

#### C. Cloud Services
- Supabase provides database and file storage services
- Infrastructure and security logs from our cloud providers

---

## 4. Google Drive Integration & Google User Data

### 4.1 Purpose of Google Drive Access

FashionUp administrators may use Google Drive to:
- **Select and import product images** from files stored in Google Drive
- **Streamline product image management** without requiring manual file uploads
- **Maintain image organization** by leveraging existing Google Drive structure

Google Drive is used only as an image source during import and is not used as FashionUp's primary storage platform. Images are copied to FashionUp-managed storage (Supabase) for platform use.

**Note:** Future versions of FashionUp may allow independent sellers to connect their own Google Drive accounts for product image management.

### 4.2 Google APIs Used

- **Google Identity Services**: For secure OAuth 2.0 authentication
- **Google Drive API**: To read file metadata and access authorized files only

### 4.3 Specific Google Drive Scopes Requested

FashionUp requests the following OAuth scope:

1. **`https://www.googleapis.com/auth/drive.readonly`**
   - **Purpose**: Read-only access to Google Drive files
   - **Use**: To display a picker of your Google Drive files and download images you select for product listings
   - **Limitation**: FashionUp cannot create, modify, delete, or move any files in your Google Drive. We do not write anything back to your Drive.

### 4.4 Google User Data Accessed

When you authorize Google Drive access, FashionUp may access:
- **Your Email Address** (associated with your Google account)
- **File Metadata** (file names, IDs, timestamps, file types)
- **Files You Select** (image content when you select them for product use)
- **Account Type Information** (to verify your identity)

### 4.5 Google User Data NOT Accessed

FashionUp explicitly does NOT access:
- Google Emails or Gmail
- Google Contacts or contact information
- Google Calendar events
- Google Photos or other photo library data
- Google Drive files you do not explicitly select
- Any files outside of your Google Drive
- Personal documents, spreadsheets, or other non-image files (unless you attempt to select them)
- Location data beyond what is required for delivery
- Phone or SMS data

### 4.6 How Google Drive Images Are Processed

**Image Selection & Download Process:**
1. You select an image from your Google Drive using the Google Drive picker
2. FashionUp downloads the selected image file
3. The image is uploaded to **FashionUp-managed storage on Supabase Storage**
4. The image is optimized and resized for the website
5. The image is served to customers from FashionUp's storage infrastructure

**After Import:**

- FashionUp does not maintain ongoing access to the original Google Drive file
- The image is independent from your Google Drive
- Modifying or deleting the image in your Google Drive does NOT affect the product listing
- Deleting the product from FashionUp does NOT delete the image from your Google Drive

**Image Retention:**

- Images are retained in FashionUp storage as long as the product listing exists
- You can delete product images by deleting or archiving the product listing
- Deleted product images are removed from FashionUp storage within 30 days

### 4.7 Data Security During Google Drive Transfer

- **HTTPS Encryption**: All communication with Google servers is encrypted using HTTPS/TLS
- **Token-Based Access**: FashionUp uses secure OAuth tokens that expire automatically
- **No Direct Download**: Files are not downloaded to personal devices; they transfer directly between Google and FashionUp servers
- **Access Logs**: Google and FashionUp maintain access logs for security monitoring

### 4.8 User Rights: Google Drive Permissions Management

#### A. Revoke Access at Any Time
You can revoke FashionUp's access to your Google Drive at any time:

**Via Google Settings:**
1. Go to [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
2. Find "FashionUp" in the list of connected apps
3. Click on FashionUp and select "Remove Access"
4. Confirm the revocation

**Via FashionUp:**
1. Log in to your FashionUp account
2. Go to Settings → Connected Accounts
3. Select "Disconnect Google Drive"
4. Confirm the disconnection

#### B. Effect of Revoking Access
- FashionUp can no longer access your Google Drive
- Existing product images remain in FashionUp storage and continue to function
- You will need to use direct image upload for future products
- Your existing product listings will not be affected

#### C. Switch Google Accounts
You can disconnect one Google account and connect a different one:
1. Revoke access from the first account (see above)
2. Authenticate with a different Google account
3. Authorize Google Drive access with the new account

### 4.9 User-Initiated Access

FashionUp accesses Google Drive files **only when an administrator explicitly chooses to connect Google Drive** and selects specific files for import into a product listing.

FashionUp does **not**:

- Continuously scan, monitor, or index Google Drive in the background
- Access Google Drive unless an administrator actively triggers the file picker
- Retain ongoing access to Google Drive after a file has been imported
- Analyze, read, or process any files not explicitly selected

Once a file is selected and imported, it is copied to FashionUp's storage and the original Google Drive file is no longer accessed.

**Note:** When independent seller accounts are introduced, sellers will be able to connect their own Google Drive accounts following the same privacy-protective approach.

### 4.10 Google User Data Policy Compliance

FashionUp complies with Google's API Services User Data Policy by:
- Using Google user data only for the declared purpose (Google Drive image selection)
- **Never selling** Google user data to third parties
- **Never sharing** Google user data with unauthorized third parties
- Providing users with the ability to revoke access at any time
- Implementing strong security measures to protect Google user data
- Allowing users to access, delete, and control their Google user data
- Not using Google user data for targeted advertising or marketing
- Transparently disclosing this usage in our Privacy Policy and OAuth consent screen
- Honoring user's privacy choices and preferences

---

## 5. How We Use Your Information

### 5.1 Providing Platform Services

- Account creation and authentication
- Product listing and catalog management
- Shopping cart and wishlist functionality
- Order processing and fulfillment
- Delivery and shipping
- Inventory management
- Payment processing
- Customer support and communication
- Image hosting and optimization

### 5.2 Google Drive Services

- Enabling authorized administrators to select images from Google Drive
- Importing selected images into FashionUp product listings
- Displaying product information to customers
- Managing product image libraries

### 5.3 Platform Improvement

- Analyzing usage patterns and user behavior
- Identifying and fixing technical issues
- Optimizing website performance
- Testing new features and improvements
- Understanding customer preferences
- Improving the shopping experience

### 5.4 Communication

- Sending transactional emails (order confirmations, shipping notifications, payment receipts)
- Account notifications (account activity, security alerts)
- Customer support responses
- Order status updates
- Promotional emails (only with your consent)
- Administrative communications

### 5.5 Security & Fraud Prevention

- Detecting and preventing fraudulent transactions
- Monitoring for unauthorized account access
- Protecting against malicious activity and cyberattacks
- Enforcing terms of service and other legal agreements
- Responding to legal requests and law enforcement inquiries

### 5.6 Legal & Compliance

- Complying with applicable laws and regulations
- Meeting Google API Services User Data Policy requirements
- Maintaining records for tax and accounting purposes
- Resolving disputes
- Protecting our legal rights and interests

### 5.7 Analytics & Business Intelligence

- Aggregating usage data (anonymized and de-identified)
- Analyzing sales trends and product performance
- Understanding customer demographics and preferences
- Generating business reports and insights
- Making data-driven business decisions

---

## 6. Who We Share Your Information With

### 6.1 Third-Party Service Providers

We share information with carefully selected third parties who process data on our behalf:

#### A. Authentication Providers

- **Supabase Authentication** — handles user authentication, password hashing, and session management
  - Data Shared: Email, password hashes, authentication credentials, session tokens
  - Privacy: [Supabase Privacy Policy](https://supabase.com/privacy)

#### B. Cloud Infrastructure & Database
- **Supabase** (PostgreSQL-based backend) — stores all application data
  - Data Shared: All user data, product data, order data, payment information
  - Privacy: [Supabase Privacy Policy](https://supabase.com/privacy)
  - Security: Encrypted at rest and in transit, row-level security (RLS) policies

- **Vercel** (CDN and hosting) — hosts the FashionUp website and serves content
  - Data Shared: Website assets, user traffic, technical logs
  - Privacy: [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy)

#### C. Payment Processors
- **M-Pesa (Daraja API) / Safaricom** — processes mobile money payments
  - Data Shared: Phone number, payment amount, transaction reference
  - Privacy: [Safaricom Privacy Policy](https://www.safaricom.co.ke/about-us/terms-conditions)
  - PCI Compliance: Payment card data is handled by certified payment processors

- **Card Payment Processors** — card payments are not yet active; M-Pesa is currently the only electronic payment method. Card payment integration will be added in a future release.

#### D. Storage Providers
- **Supabase Storage** — stores product images and files
  - Data Shared: Product images, administrator-uploaded files
  - Security: Encrypted storage with access controls

- **Google Drive** — administrator-managed storage for product images
  - Data Shared: Only files explicitly selected and authorized by administrators
  - Security: Google's encryption and security standards
  
**Note:** When independent seller functionality is introduced, sellers will be able to connect their own Google Drive accounts for image management.

#### E. Communication Services
- **Email Services** (Google SMTP / Gmail) — sends transactional emails
  - Data Shared: Email address, order data, account information
  - Purpose: Sending order confirmations, shipping notifications, password resets
  - Privacy: [Google Privacy Policy](https://policies.google.com/privacy)

#### F. Analytics Services

FashionUp does not currently use third-party analytics services. Usage data is not shared with external analytics providers.

### 6.2 Legal Requirements & Law Enforcement

We may disclose personal information when:
- Required by law or court order
- Responding to legal process (subpoena, warrant)
- Protecting the rights, privacy, safety, or property of FashionUp, users, or the public
- Detecting, preventing, or addressing fraud, security, or technical issues
- Enforcing our Terms of Service and other agreements

### 6.3 Business Transitions

If FashionUp is involved in a merger, acquisition, bankruptcy, or asset sale:
- Your personal information may be transferred as part of the transaction
- You will be notified via email and/or prominent notice on our website
- The acquiring entity must commit to protecting your privacy with terms no less protective than this policy

### 6.4 Aggregated & De-Identified Data

We may share aggregated, de-identified data that cannot reasonably be used to identify you:
- Sales statistics and trends
- Product performance metrics
- Market research insights
- Industry reports
- Anonymous usage analytics

---

## 7. Data Storage & Retention

### 7.1 Where Your Data Is Stored

**Geographic Location:**

- **Primary Storage**: European Union (EU) region via Supabase infrastructure
- **CDN Distribution**: Website assets are distributed globally via Vercel CDN for performance
- **Backups**: FashionUp does not currently maintain automated backup infrastructure. Backup and disaster recovery capabilities may be introduced in future versions.

Data is stored on infrastructure managed by Supabase within the European Union.

### 7.2 Data Retention Periods

#### A. Active Account Data
**While your account is active:**

- User profile information: Retained indefinitely or until account deletion
- Authentication credentials: Retained for account security
- Order history: Retained for 7+ years (for compliance, tax, legal requirements)
- Payment records: Retained for 7 years (for tax and legal requirements)
- Cart items and wishlist: Retained while account is active; deleted 30 days after account deletion
- Product listings: Currently managed by administrators; retention policies will be updated when independent seller accounts are introduced
- Messages and support tickets: Retained for 2+ years for support reference

#### B. After Account Deletion

**Account Deletion Timeline:**

- **Day 0**: You submit a deletion request
- **Days 0–30**: Your account is soft-deleted and may be recoverable on request
- **After Day 30**: Your personal data is permanently deleted from all active systems

**Exceptions to Deletion:**

- Order data is retained for 7 years for tax and legal compliance
- Payment records may be retained per legal/regulatory requirements
- Anonymized data used for analytics may be retained indefinitely
- Data required by law cannot be deleted

#### C. Google Drive Integration Data

**Google Tokens:**

- Access tokens: Retained while account is active; deleted upon account deletion
- Refresh tokens: Retained while account is active; deleted upon account deletion
- Token expiry: Access tokens automatically expire after 1 hour of non-use

**Imported Images:**

- Product images imported from Google Drive: Retained as long as the product listing exists
- When product is deleted: Images are deleted from FashionUp storage within 30 days
- Your Google Drive files: Always remain in your Google Drive; FashionUp does not delete them

#### D. Backup & Disaster Recovery

FashionUp does not currently maintain automated backup infrastructure. Data deletion requests are applied to active systems immediately. Backup and disaster recovery capabilities may be introduced in future versions.

### 7.3 Cookie & Local Storage Retention

- **Session Cookies**: Automatically deleted when you close your browser
- **Authentication Cookies**: Retain for duration of your login session
- **localStorage Items** (cart, wishlist): Retained indefinitely on your device until you manually clear browser data
- **sessionStorage**: Automatically cleared when you close your browser tab/window

---

## 8. Security Measures

### 8.1 Technical Security Measures

#### A. Data Encryption

- **In Transit**: All data is encrypted using HTTPS/TLS encryption
- **At Rest**: Industry-standard encryption technologies are used to protect data at rest
- **OAuth Tokens**: Stored in the database (encrypted at rest); a fallback copy is stored in browser `localStorage` which is not independently encrypted — we recommend clearing browser data when using shared devices
- **Google Tokens**: Encrypted when stored and transmitted

#### B. Authentication & Access Control
- **Supabase Authentication**: Industry-standard password hashing (bcrypt)
- **Session Tokens**: Secure, time-limited tokens for maintaining sessions
- **Multi-Factor Authentication**: Not yet implemented; planned for future releases for administrator accounts and future seller accounts
- **Row-Level Security (RLS)**: Database-level access controls prevent unauthorized data access
- **Role-Based Access Control (RBAC)**: Users have defined roles (Customer, Admin) with specific permissions; seller roles will be added when marketplace functionality is introduced

#### C. Database Security
- **Supabase Security**: Database access is restricted to authenticated application servers
- **Firewall Rules**: Network-level protection against unauthorized access
- **SQL Injection Prevention**: Parameterized queries prevent SQL injection attacks
- **Access Logging**: Database access is logged by Supabase infrastructure for security monitoring

#### D. Application Security

FashionUp implements appropriate application and infrastructure security controls designed to protect user information, including input validation, output encoding, and protection against common web vulnerabilities.

### 8.2 Payment Security

- **PCI DSS Compliance**: Payment processors are PCI DSS Level 1 certified
- **No Card Data Storage**: FashionUp does not store credit card numbers or CVV codes
- **Tokenization**: Payment tokens are used instead of storing actual card details
- **M-Pesa Security**: Payment requests are encrypted and use Daraja API security standards

### 8.3 Organizational Security Measures

- **Access Controls**: Employees have access only to data necessary for their roles
- **Security Reviews**: FashionUp periodically reviews security practices and infrastructure to identify and address potential vulnerabilities
- **Data Breach Notification**: Users are notified within 30 days of discovering a breach (Kenya DPA) or within 72 hours for EU residents (GDPR)
- **Vendor Assessment**: Third-party vendors are evaluated for security compliance

### 8.4 Security Limitations

While we implement strong security measures, no system is 100% secure. You acknowledge that:
- Security is not guaranteed; unauthorized access is possible but unlikely
- We cannot guarantee protection against all types of cyber attacks
- You are responsible for keeping your password confidential
- You should not share your account credentials with anyone

---

## 9. Your Privacy Rights & Choices

### 9.1 Access Your Information

You have the right to request a copy of the personal information we hold about you.

**How to Request:**

- Email: [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com)
- Subject: "Data Access Request"
- Include: Your full name, email, account ID
- Response Time: Within 30 days

**What You'll Receive:**

- Copy of all personal data we hold
- Detailed information about data collection and processing
- List of third parties with whom we share your data

### 9.2 Correct Your Information

You can update your profile information at any time:
- Login to your FashionUp account
- Go to Settings → Profile
- Edit and save your information

If you cannot update information yourself, contact us at [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com)

### 9.3 Delete Your Account & Data

You have the right to request deletion of your account and personal information.

**How to Request Account Deletion:**
1. **Self-Service** (if available):
   - Go to Settings → Account
   - Select "Delete Account"
   - Follow the confirmation steps

2. **Manual Request**:
   - Email: [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com)
   - Subject: "Account Deletion Request"
   - Include: Your full name, email, account ID
   - Response Time: Within 30 days

**What Happens When You Delete Your Account:**

- Your account is deactivated and marked for deletion
- Personal data is permanently deleted from active systems within 30 days
- Order history is retained for 7 years (legal requirement)
- Product listings you created are removed

### 9.4 Export Your Data

You can request your data in a machine-readable format (CSV, JSON).

**How to Request:**

- Email: [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com)
- Subject: "Data Export Request"
- Response Time: Within 30 days

### 9.5 Revoke Third-Party Permissions

#### A. Google Drive Access
- **Revoke in Google Settings**: Visit [myaccount.google.com/permissions](https://myaccount.google.com/permissions), find FashionUp, and remove access
- **Revoke in FashionUp**: Go to Settings → Connected Services → Disconnect Google Drive
- **Effect**: FashionUp can no longer access your Google Drive, but existing product images remain

#### B. Marketing Communications
You can opt out of promotional emails and marketing communications:
- Click "Unsubscribe" at the bottom of any promotional email
- Update your preferences in Settings → Notifications → Email Preferences
- Email [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com) to request removal from all mailing lists

#### C. Analytics & Cookies
You can control how your data is used:
- **Disable Cookies**: Adjust your browser settings (instructions below)
- **Opt Out of Analytics**: Use browser extensions like Ghostery or Ublock Origin
- **Do Not Track**: Enable the "Do Not Track" signal in your browser settings

### 9.6 Browser Controls & Opt-Outs

#### Clear Local Storage & Cookies
- **Chrome**: Settings → Privacy and Security → Clear Browsing Data → Select "Cookies and cached images"
- **Firefox**: Settings → Privacy → Cookies and Site Data → Clear Data
- **Safari**: Preferences → Privacy → Manage Website Data → Remove All

#### Disable Cookies
- **Chrome**: Settings → Privacy and Security → Cookies → Block all cookies (not recommended)
- **Firefox**: Settings → Privacy → Cookies → Never remember history
- **Safari**: Preferences → Privacy → Cookies → Never

#### Do Not Track (DNT)
- **Chrome**: Settings → Privacy and Security → Send Do Not Track requests
- **Firefox**: Settings → Privacy → Do Not Track → Always
- **Safari**: Preferences → Privacy → Ask websites not to track me

### 9.7 Rights Under Privacy Laws

Users located in jurisdictions that provide additional privacy rights may contact FashionUp to exercise applicable rights under their local laws.

#### Kenya DPA Rights (for Kenya residents)

- Right to access personal information held by FashionUp
- Right to correct or delete personal information
- Right to lodge complaints with the Office of the Data Protection Commissioner
- Right to seek judicial remedies

### 9.8 How to Exercise Your Rights

To exercise any of these rights:

**Contact Information:**

- Email: [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com)
- Mailing Address: Nairobi, Kenya

**What to Include:**

- Your full name
- Email address associated with your account
- Account ID (if applicable)
- Specific right you're exercising
- Any supporting documentation

**Verification:**
We may ask you to verify your identity to protect your privacy before fulfilling your request.

**Response Time:**

- Standard requests: Within 30 days
- Complex requests: May take up to 60 days (you will be notified)
- We will provide a detailed explanation of any delays

---

## 10. Children's Privacy

### 10.1 Age Restrictions

FashionUp is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.

### 10.2 If You're Under 18

If you are between 13 and 18 years old:
- Parental/guardian consent may be required depending on your jurisdiction
- You should review this Privacy Policy with your parents or guardians
- Your parents/guardians can request deletion of your account

### 10.3 If You're a Parent/Guardian

If you believe we have collected information from a child under 13:

- Please contact us immediately at [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com)
- We will delete the information and the account
- We will not use the information for any purpose

---

## 11. Third-Party Links & Services

### 11.1 External Links

FashionUp may contain links to third-party websites and services that are not operated by us, including:
- Social media platforms
- Payment gateways
- Google Drive (for image selection)
- Shipping providers
- Analytics services

### 11.2 Third-Party Privacy Policies

**We are not responsible for the privacy practices of third-party websites.** When you click on external links, you are subject to their privacy policies, not ours. We recommend reviewing their privacy policies before providing personal information.

### 11.3 Third-Party Plugins & Widgets

If you interact with third-party plugins or widgets (e.g., social sharing buttons):
- The third party may collect your information
- This data is governed by their privacy policy
- We encourage you to review their privacy policies

---

## 12. International Data Transfers

### 12.1 Data Location

**FashionUp operates primarily in Kenya and serves users across Africa and beyond.**

Personal information may be transferred to, stored in, and processed in:
- Kenya (primary users)
- European Union (via Supabase infrastructure)
- United States (Google Cloud services, Vercel CDN)

### 12.2 Data Transfer Mechanisms

Personal information may be processed by trusted service providers that operate internationally and implement appropriate safeguards for data protection.

### 12.3 Your Consent

By using FashionUp, you consent to the transfer of your personal information to countries outside your country of residence, including countries that may have different privacy laws than your home country.

---

## 13. Additional Jurisdiction Rights

FashionUp's primary market is East Africa. Users located in jurisdictions that provide additional privacy rights (such as California or the European Union) may contact FashionUp at [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com) to exercise applicable rights under their local laws.

---

## 14. European Union Residents

FashionUp does not actively target EU users. However, if you are located in the EU or UK and have questions about how your data is handled, contact [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com). You may also lodge a complaint with your national Data Protection Authority, listed at [https://edpb.ec.europa.eu/about-edpb/board/members_en](https://edpb.ec.europa.eu/about-edpb/board/members_en).

---

## 15. Kenya Data Protection Act Compliance

For residents of Kenya:

### 15.1 Privacy Rights Under the DPA

The Kenya Data Protection Act (DPA) grants you the right to:
- Know what personal data is held about you
- Request correction of inaccurate data
- Request deletion of data (with exceptions)
- Withdraw consent for processing
- Lodge complaints with the Office of the Data Protection Commissioner

### 15.2 Data Protection Commissioner

**Office of the Data Protection Commissioner**

- Website: [https://www.odpc.go.ke/](https://www.odpc.go.ke/)
- Email: [complaints@odpc.go.ke](mailto:complaints@odpc.go.ke)
- You can lodge complaints if FashionUp violates your privacy rights

### 15.3 FashionUp's Obligations

Under the Kenya DPA, we:
- Collect data lawfully and transparently
- Ensure data is accurate and kept up-to-date
- Implement security measures to protect data
- Respect your privacy rights and preferences
- Comply with data subject requests within 30 days

---

## 16. Data Breach Notification

### 16.1 Notification of Breaches

In the event of a security breach involving your personal information:

**We will notify you if:**

- There is a significant risk to your privacy or security
- The breach involves sensitive data (passwords, payment information, Google tokens)
- We are legally required to notify you

**You will be notified within:**

- **30 days** of discovering the breach (Kenya DPA requirement)
- **72 hours** if you are an EU resident (GDPR requirement)
- **Without unreasonable delay** in all other cases

**Notification will include:**

- Description of the personal data involved
- Likely consequences of the breach
- Measures we're taking to mitigate harm
- Contact information for questions

### 16.2 Law Enforcement Notification

We may notify law enforcement, payment processors, and other relevant authorities if:
- A breach involves criminal activity
- Payment card data is compromised
- We are legally required to do so

---

## 17. Google API Services User Data Policy

This section explains how FashionUp complies with Google's API Services User Data Policy:

### 17.1 Limited Use

FashionUp uses Google user data only for the purposes explicitly stated in this Privacy Policy:
- Authentication and user identification
- Google Drive image file selection for product listings
- Displaying authorized images within FashionUp

### 17.2 Prohibited Uses

FashionUp **does not:**

- Sell Google user data
- Transfer Google user data to third parties for marketing or advertising
- Use Google user data for purposes other than those disclosed
- Share Google user data with unauthorized third parties
- Combine Google user data with data from other sources for targeting
- Use Google user data to train artificial intelligence models, machine learning models, or generalized algorithms

### 17.3 Artificial Intelligence and Machine Learning

FashionUp **does not:**

- Use Google user data to train artificial intelligence models
- Use Google user data to train machine learning models
- Use Google user data to develop or improve generalized algorithms
- Process Google user data through AI/ML systems for any purpose other than the core functionality described in this policy

Google user data is used solely for its stated purpose: enabling administrators to import product images from Google Drive into FashionUp's product catalog.

### 17.4 Security

Google user data is protected with the same security measures as all personal data:
- Encryption in transit and at rest
- Access limited to authorized employees
- Periodic security reviews
- Compliance with industry standards

### 17.5 Transparency

FashionUp transparently discloses:
- What Google user data is accessed
- Why it is accessed
- How it is used
- How users can revoke access
- How long data is retained

### 17.6 User Control

Users have full control over their Google user data:
- Can revoke access at any time via Google Settings or FashionUp Settings
- Can request deletion of stored Google tokens
- Can switch between Google accounts
- Can download or export their data

### 17.7 Compliance Certification

By using Google APIs, FashionUp certifies that it:
- Complies with Google's API Services User Data Policy
- Uses OAuth only for the authorized scopes
- Implements appropriate security measures
- Allows users to revoke access
- Does not misuse user data

---

## 18. Changes to This Privacy Policy

### 18.1 Policy Updates

We may update this Privacy Policy periodically to reflect:
- Changes in our data practices
- New features or services
- Changes in laws and regulations
- Feedback from users and regulators

### 18.2 Notification of Changes

**Material changes** will be communicated to you:

- Email notification sent to your registered email address
- Prominent notice on our website
- Updated "Last Modified" date at the top of this policy
- For significant changes, we may require explicit consent

### 18.3 Your Acceptance

If you do not agree with changes to this Privacy Policy, you may:
- Stop using FashionUp
- Request account deletion
- Contact us to discuss concerns

Your continued use of FashionUp after changes constitutes your acceptance of the updated Privacy Policy.

---

## 19. Definitions & Clarifications

| Term | Definition |
|------|-----------|
| **FashionUp** | The e-commerce platform at [https://fashionup.vercel.app](https://fashionup.vercel.app) |
| **Personal Information** | Any information that identifies or could identify an individual |
| **Google User Data** | Information obtained from Google about you or through your Google account |
| **Processing** | Any operation performed on data (collection, storage, use, deletion) |
| **Seller** | Future account type that will allow independent sellers to list and sell products (not currently available) |
| **Customer** | A user who purchases products from FashionUp |
| **Administrator** | A FashionUp employee with elevated permissions |
| **Data Breach** | Unauthorized access to or disclosure of personal information |
| **OAuth** | An authentication standard allowing third-party access with user permission |
| **Token** | A secure string of characters that grants access to user accounts |
| **RLS** | Row-Level Security; database-level access control |
| **PCI DSS** | Payment Card Industry Data Security Standard |

---

## 20. Contact Us

### 20.1 Privacy Questions & Requests

If you have questions, concerns, or requests regarding your privacy, please contact us:

**Email:** [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com)

**Mailing Address:**  
FashionUp  
Nairobi, Kenya

**Response Time:** We typically respond to privacy inquiries within 48 hours.

### 20.2 Privacy Contact

**Pascal Twoli**  
Founder and Data Protection Contact  
Email: [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com)  
Phone: +254119249141

### 20.3 Complaints & Escalation

If your concern is not resolved:

**For Kenya Residents:**

- Lodge a complaint with the Office of the Data Protection Commissioner
- Email: [complaints@odpc.go.ke](mailto:complaints@odpc.go.ke)

**For EU/UK Residents:**

- Lodge a complaint with your national Data Protection Authority
- Find your authority at [https://edpb.ec.europa.eu/about-edpb/board/members_en](https://edpb.ec.europa.eu/about-edpb/board/members_en)

---

## 21. Acknowledgment & Agreement

**By accessing and using FashionUp, you acknowledge that:**

- You have read this Privacy Policy in full
- You understand how your personal information is collected and used
- You consent to the collection, use, and disclosure of your information as described
- You understand your rights and how to exercise them
- You agree to comply with this Privacy Policy and our Terms of Service

---

## Appendix A: Third-Party Privacy & Security Links

| Service | Privacy Policy | Security Certifications |
|---------|---|---|
| Supabase Authentication | [https://supabase.com/privacy](https://supabase.com/privacy) | SOC 2 Type II |
| Supabase | [https://supabase.com/privacy](https://supabase.com/privacy) | SOC 2 Type II |
| Google Drive API | [https://policies.google.com/privacy](https://policies.google.com/privacy) | ISO 27001, SOC 3 |
| Vercel | [https://vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy) | SOC 2 Type II, ISO 27001 |
| Safaricom / M-Pesa | [https://www.safaricom.co.ke/about-us/terms-conditions](https://www.safaricom.co.ke/about-us/terms-conditions) | PCI DSS Level 1 |

---

## Appendix B: User Data Request Process

### Process for Data Subject Access Requests (DSAR)

1. **Submit Request**
   - Email [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com)
   - Include: Name, email, account ID, and type of request

2. **Verification**
   - We verify your identity
   - May request additional information
   - Typically completed within 3-5 business days

3. **Compilation**
   - Gather all personal data you've provided
   - Prepare data export (CSV, JSON)
   - Create explanatory document

4. **Delivery**
   - Send data to your email within 30 days
   - Include a letter explaining the data
   - Provide contact info for follow-up questions

5. **Follow-Up**
   - You have 15 days to ask clarifying questions
   - We're available for further assistance

---

**END OF PRIVACY POLICY**

---

*This Privacy Policy is effective as of June 11, 2026 and was last updated on June 2026.*

*FashionUp is committed to protecting your privacy and ensuring compliance with applicable privacy laws. If you have any questions about this Privacy Policy or FashionUp's privacy practices, please contact us at [fashionup.ex@gmail.com](mailto:fashionup.ex@gmail.com)*
