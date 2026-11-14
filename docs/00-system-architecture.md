# SAHL Platform – System Architecture & Technical Specification v1.0

Fifth source brief, alongside [00-master-prompt.md](00-master-prompt.md), [00-business-requirements.md](00-business-requirements.md), [00-functional-requirements.md](00-functional-requirements.md), and [00-ui-ux-design-system.md](00-ui-ux-design-system.md). Where this spec confirms decisions already documented in [02-architecture.md](02-architecture.md), no further action was needed. Where it conflicts with or adds to what's already built, that's reconciled and cross-referenced below and in the numbered docs; this file preserves the source text as delivered.

> **Errata (2026-07-26)**: the Security section below names BCrypt for password hashing. This has been overridden — argon2id is the official algorithm. See [05-security.md](05-security.md) §1 for the current, canonical decision. Preserved as originally written below; not edited in place.

## Architecture Philosophy

Enterprise-grade, cloud-ready, modular. Must support millions of users, multiple countries/languages/payment providers without a complete redesign. Priorities: scalability, security, performance, maintainability, testability, modularity.

## High-Level Architecture

Mobile Application (Flutter) → API Gateway → Backend Services → Database → Storage → External Services → Analytics → Monitoring.

## Technology Stack

**Mobile**: Flutter, Dart, Material Design 3, Riverpod, GoRouter, Dio, Hive, Flutter Secure Storage, Firebase Messaging, Google Maps, Localization.

**Backend**: Next.js, TypeScript, Node.js, Prisma ORM, REST API (future GraphQL), Socket.IO, Redis, BullMQ (background jobs), Cron Scheduler.

**Database**: PostgreSQL, read replicas (future), migrations, automatic backups, soft deletes, audit logs.

**Object Storage**: Cloudinary; future AWS S3 / Azure Blob / Google Cloud Storage. Storage implementation must be abstracted.

**Cache Layer**: Redis — provider profiles, categories, popular services, search suggestions, session cache, OTP cache, rate limiting, analytics cache.

**Real-Time Layer**: Socket.IO — chat, typing indicator, location updates, order status, notifications, presence, live tracking.

**Push Notifications**: Firebase Cloud Messaging — Android, iOS, scheduled, topic, individual, silent notifications.

## Authentication

JWT, refresh tokens, OTP verification, password login. Future: Google, Apple, biometric authentication.

## Authorization

RBAC. Roles: Customer, Provider, Company, Admin, Finance, Moderator, Support, Verification, Super Admin. Permissions must be granular.

## Backend Modules

Authentication, Users, Profiles, Categories, Services, Bookings, Projects, Contracts, Bidding, Messages, Wallet, Payments, Notifications, Reviews, Analytics, Reports, Promotions, Referrals, Support, Disputes, Administration, System Settings, Audit Logs, Media, Location, Verification.

## API Standards

RESTful, JSON, versioned (`/api/v1/`, future `/api/v2/`). Consistent response structures.

**Standard success response**: `success`, `message`, `data`, `pagination` (when applicable), `metadata`.

**Standard error response**: `success`, `errorCode`, `message`, `details`, `traceId`, `timestamp`.

## Validation

Server-side validation is mandatory. Client validation improves UX but never replaces server validation.

## Logging

Application, Authentication, Error, Payment, Audit, Security, API, Background Job logs.

## Monitoring

CPU, Memory, API Performance, Database Performance, Cache Performance, Storage Usage, Error Rates, Realtime Connections, Notification Delivery.

## Security

BCrypt password hashing, JWT rotation, HTTPS only, rate limiting, CSRF protection, CORS configuration, SQL injection protection, XSS protection, input sanitization, file validation, virus scanning (future), encrypted secrets, environment variables, audit trail.

## Background Jobs

Email sending, SMS sending, push notifications, image processing, analytics aggregation, scheduled reports, referral rewards, subscription renewals, automatic cleanup.

## Search Engine

Keyword search, category search, provider search, nearby search, autocomplete, recent searches, popular searches. Future: AI semantic search.

## Smart Matching Engine

Input factors: distance, availability, ratings, reviews, experience, price, verification, response time, current workload, cancellation rate, customer preferences. Output: ranked provider list, recommendation score, estimated response time.

## Payment Layer

Abstract payment interface — no gateway hardcoded, support multiple providers, each country configures its own gateway. Wallet integration required. Escrow support required. Refund support required.

## File Management

Images, documents, contracts, certificates, invoices, receipts, profile photos, portfolio files. Compression, optimization, thumbnail generation.

## Maps Integration

Google Maps — provider location, customer location, route navigation, distance calculation, ETA, geocoding, reverse geocoding.

## Analytics

Orders, revenue, provider growth, customer growth, retention, cancellation rate, search trends, top categories, peak hours, popular locations.

## Admin Architecture

Dashboard, user management, provider management, company management, category management, payment management, wallet management, dispute center, support center, reports, analytics, system configuration, role management, audit logs.

## Scalability Strategy

Stateless APIs, horizontal scaling, Redis cache, CDN, background workers, database indexing, lazy loading, pagination, connection pooling.

## Deployment

Development, Testing, Staging, Production — separate configuration for each environment.

## CI/CD

Automated testing, linting, code formatting, security checks, migration execution, automatic deployment, rollback support.

## Backup Strategy

Daily database backup, weekly full backup, media backup, configuration backup, encrypted storage, recovery testing.

## Disaster Recovery

RTO, RPO, automatic failover (future), high availability (future).

## Coding Standards

TypeScript strict mode, SOLID principles, Clean Architecture, dependency injection, repository pattern, feature-based folder structure, unit tests, integration tests, end-to-end tests, comprehensive documentation.

## Future Expansion

Multiple countries, currencies, time zones, tax systems, languages. White label support. Microservices migration. AI services. Public API. Enterprise integrations.

Every architectural decision must prioritize long-term maintainability, extensibility, security, and performance over short-term convenience.
