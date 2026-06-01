# FashionUp Payment Architecture & Roadmap

Version: 1.0
Status: Approved Architecture
Date: May 2026

---

# Executive Summary

FashionUp requires a payment architecture that supports both its current single-store operation and future evolution into a multi-seller marketplace.

The architecture must:

* Support M-Pesa STK Push as the initial payment method.
* Allow future addition of Card, PayPal, Apple Pay, Google Pay, and other payment providers.
* Allow payment methods to be managed through Admin Settings.
* Support both platform-collected payments and direct-to-seller payments in future marketplace phases.
* Avoid hardcoded payment logic.
* Remain extensible without major checkout redesigns.

---

# Current Business Model

FashionUp currently operates as:

* Single storefront
* Single owner
* Single M-Pesa receiving account
* No seller accounts
* No commission system
* No payout system

Customer Flow:

Customer → FashionUp Checkout → M-Pesa STK → FashionUp Account

---

# Current Payment Methods

Phase 1 Supported Methods:

* M-Pesa STK Push (Daraja)
* Cash on Delivery

Future Methods:

* Card Payments
* PayPal
* Apple Pay
* Google Pay
* Bank Transfer
* Other Local Payment Providers

---

# Payment Configuration Philosophy

All payment functionality must be controlled through platform settings.

No payment method should be permanently hardcoded in checkout.

Checkout should render methods dynamically from platform configuration.

---

# Core Platform Settings

platform_settings

* enabled_payment_methods
* payment_collection_mode
* default_currency
* commission_type
* commission_value
* settlement_frequency
* automatic_settlements

---

# Payment Provider Registry

payment_providers

Fields:

* id
* provider_code
* provider_name
* provider_type
* enabled
* configuration

Examples:

* mpesa
* card
* paypal
* cod

---

# Checkout Rendering Rules

Checkout must:

1. Query enabled payment methods.
2. Display only enabled methods.
3. Render provider-specific forms dynamically.
4. Submit payment through provider-specific handlers.

Example:

enabled_payment_methods:

["mpesa","cod"]

Checkout displays:

✓ M-Pesa
✓ Cash on Delivery

Card and PayPal remain hidden.

---

# Phase 1 Architecture

Payment Gateway:

Daraja API

Supported Methods:

* M-Pesa STK Push
* Cash on Delivery

Order Flow:

Create Order
→ Initiate STK
→ Await Callback
→ Update Payment Status
→ Confirm Order

Order States:

pending
paid
failed
cancelled
refunded

---

# Security Requirements

Secret credentials must never be exposed to browsers.

All payment initiation must occur through Supabase Edge Functions.

All callbacks must be signature verified.

Raw card data must never be stored.

---

# Future Marketplace Architecture

Marketplace Mode:

Multi-Seller

Supported Models:

1. Platform Collection
2. Direct-to-Seller Collection
3. Hybrid Collection

The active mode must be selected through Admin Settings.

---

# Platform Collection Model

Customer
→ FashionUp
→ Seller Settlement

Features Required:

* Commission Engine
* Settlement Engine
* Seller Wallets
* Seller Withdrawals
* Financial Reporting

---

# Direct-to-Seller Model

Customer
→ Seller Account

Features Required:

* Seller Payment Credentials
* Seller Verification
* Dynamic Payment Routing
* Seller Payment Health Monitoring

---

# Seller Payment Accounts

Future Table:

seller_payment_accounts

Fields:

* seller_id
* provider
* account_name
* shortcode
* consumer_key
* consumer_secret
* passkey
* is_verified
* is_active

Encrypted storage required.

---

# Marketplace Commission System

Future Support:

Percentage Commission

Example:

10%

Order: KES 1,000

Seller Receives: KES 900
FashionUp Receives: KES 100

Flat Fee Commission

Hybrid Commission

---

# Settlement Engine

Future Support:

* Instant Settlement
* Daily Settlement
* Weekly Settlement
* Monthly Settlement

Configured via Admin Settings.

---

# Reporting Requirements

Future Reporting:

Platform:

* Gross Revenue
* Net Revenue
* Commission Revenue
* Payment Success Rate

Seller:

* Revenue
* Settlements
* Pending Payouts
* Payment Failures

---

# Phase Roadmap

Phase 1

* Platform Settings
* Dynamic Payment Methods
* Daraja Integration
* STK Push
* Webhooks
* Order Status Updates

Phase 2

* Card Payments
* PayPal
* Saved Payment Methods Improvements

Phase 3

* Seller Accounts
* Seller Payment Profiles
* Marketplace Settings

Phase 4

* Commission Engine
* Settlement Engine
* Multi-Seller Payment Routing

Phase 5

* Financial Reporting
* Seller Payout Automation
* Advanced Marketplace Finance

---

# Architectural Principle

Business decisions must be configurable.

Checkout should read payment configuration from the platform instead of relying on hardcoded payment behavior.
