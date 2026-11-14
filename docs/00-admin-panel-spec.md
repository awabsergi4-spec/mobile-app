# Enterprise Admin Panel & Dynamic Platform Management

Sixth source brief, alongside the master prompt, business/functional requirements, UI/UX design system, and system architecture specs. Consolidated into [ADR-007](02-architecture.md#13-adr-007-admin-panel-as-platform-control-center) and the numbered docs; this file preserves the source text as delivered.

## Core Philosophy

The Admin Panel must NOT be a traditional CRUD dashboard — it is the Platform Control Center, capable of managing almost every aspect of the platform without a new mobile app release.

**Governing rule**: if a business requirement can be fulfilled by changing data, configuration, content, workflows, or settings instead of application logic, it must be manageable through the Admin Panel. The Flutter app renders data/configuration from the backend wherever possible. Only changes that modify architecture, introduce new client-side capabilities, or require new native permissions need a new app release.

Design goal: comparable to Uber/Amazon Marketplace/Airbnb/Shopify admin systems, not a simple dashboard. Modular, permission-based (RBAC), extensible, configurable.

## Required Modules

**Dashboard** — configurable widgets (Revenue, Orders, Active Providers, Active Customers, Pending Requests, Pending Verifications, Open Disputes, Wallet Balance, AI Usage, Search Trends, Live Map, Notifications, System Health, API Health, Queue Status), configurable per administrator role.

**Content Management System** — Home Page, Landing Pages, About, Contact, FAQ, Terms & Conditions, Privacy Policy, Help Center, Tutorials, Blog, Announcements, Marketing Pages. No app update for content changes.

**Dynamic Home Builder** — drag-and-drop, not hardcoded. Components: Hero Banner, Image Slider, Categories, Featured Categories, Featured Providers, Featured Services, Emergency Services, Nearby Services, Recommended Services, Recently Viewed, Trending Services, Promotions, Advertisements, Seasonal Campaigns, News, Custom HTML (web only), Custom Widgets (future). Supports reordering, visibility, scheduling, country/city/user-role targeting, A/B testing, preview before publishing.

**Advertisement Management** — Banner Ads, Native Ads, Sponsored Providers/Services/Categories, campaign scheduling/budget, target audience (country/city/category/language), analytics, click/conversion tracking.

**Notification Center** — Push, In-App, Popup, Full Screen Alerts, Emergency Broadcasts, Scheduled Notifications, Notification Templates. Targeting: country, city, language, user role, service category, provider type, individual users, custom segments.

**Popup Management** — Welcome, Maintenance, Promotion, Emergency, Update Reminder, Survey, Coupon popups. Each supports images, video, buttons, countdown timer, schedule, expiration, audience targeting, frequency rules.

**Remote Configuration** — modify without app release: commission percentages, platform fees, referral rewards, wallet rules, escrow rules, AI features, feature flags, maintenance mode, app version requirements (min/max), OTP settings, session timeouts, rate limits, search limits, upload limits, file size limits, payment configuration, Google Maps keys, feature availability, business rules. App fetches config dynamically.

**Marketplace Management** — Categories, Subcategories, Service Types, Service Attributes, Pricing Templates, Dynamic Forms, Required Documents, Verification Rules, Contract Templates, Service Availability Rules. No code deployment required.

**AI Management** — enable/disable AI, select AI provider/model, configure prompts/temperature/token limits, view AI logs/costs/usage, configure AI permissions. AI stays abstracted through the AI Provider interface.

**Localization Management** — Languages, Translations, Dynamic Labels, Email Templates, SMS Templates, Notification Templates, Marketing Messages. New languages without code changes.

**User & Provider Management** — verification (user/provider/business), bulk actions, suspension, blacklists, whitelists, risk scores, fraud flags.

**Finance Management** — Wallets, Escrow, Payments, Refunds, Withdrawals, Commissions, Taxes, Promotions, Coupons, Referral Rewards.

**Analytics** — Revenue, Orders, User/Provider Growth, Search Trends, Popular Categories, AI Usage, Retention, Conversion, Cancellations, Fraud, Geography, Peak Hours.

**Permissions (RBAC)** — every module: View, Create, Edit, Delete, Export, Approve, Reject, Configure, Publish. Admins see only permitted modules.

**Audit System** — every admin action logged: who, when, previous/new value, IP, device, browser, reason, related entity. Nothing permanently deleted; soft deletes wherever appropriate.

**Plugin Architecture** — future plugins (new payment gateways, AI providers, SMS/email providers, ERP/CRM/government integrations) installable without changing core architecture.

## Final Architectural Rule

Before implementing any future feature, ask: "Can this requirement be solved through configuration, content management, workflow management, feature flags, remote configuration, or data instead of changing application code?" If yes, implement it through the Admin Panel. Only require a new app release when the change fundamentally modifies client-side functionality or architecture. The Admin Panel is the operational brain of SAHL; the mobile app is a lightweight, dynamic client driven by backend configuration.
