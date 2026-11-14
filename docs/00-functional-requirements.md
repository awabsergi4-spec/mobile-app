# SAHL Platform – Functional Requirements & User Stories v1.0

Third source brief, alongside [00-master-prompt.md](00-master-prompt.md) (technical) and [00-business-requirements.md](00-business-requirements.md) (business/product). Deltas are integrated into the numbered docs (01–07) and the Prisma schema; this file preserves the source text as delivered.

## User Roles

Guest, Customer, Service Provider, Business Provider, Company Account, Administrator, Super Administrator, Finance Officer, Verification Officer, Customer Support, Moderator. A single account can act as both Customer and Service Provider.

## Authentication Module

**Registration**: mobile number (primary), email (optional), Google/Apple (future). Flow: enter phone → receive OTP → verify OTP → create profile → select account purpose → finish onboarding.

**Login**: phone + OTP, or phone + password. Future: biometric (Face ID, fingerprint).

**Password Recovery**: reset through OTP.

## User Profile

Personal information: profile picture, bio, gender (optional), languages spoken, country, state, city, address, GPS location, preferred language, notification settings, privacy settings, verification status, wallet balance, ratings, completed orders, joined date, activity history.

## Service Provider Profile

Additional: business name, business logo, business description, national ID, business license (optional), tax number (optional), verification documents, working hours, emergency availability, years of experience, certificates, skills, portfolio, gallery, price range, coverage area, travel distance, remote availability, languages, insurance (future).

## Search Module

Search by: keyword, category, subcategory, location, distance, price, rating, availability, provider type, verified only, open now, emergency, remote, on-demand, contract, scheduled.

**Results display**: provider name, rating, distance, estimated arrival, price indicator, verification badge, availability, completed jobs, favorite button, quick contact.

## Smart Matching

Recommends providers using: distance, rating, availability, current workload, response time, price, experience, completion rate, cancellation rate, customer preferences, verification level, emergency status.

## Categories (examples)

Home Services, Vehicle Services, Construction, Electrical, Plumbing, Cleaning, Transportation, Delivery, Digital Services, Programming, Design, Marketing, Writing, Education, Healthcare (future), Business Services, Legal Services, Government Services (future).

## Customer Features

Browse categories, search services, view providers, compare providers, book provider, request quote, schedule appointment, create long-term project, receive/accept/reject offers, track progress, chat (files, voice messages, images, documents), invoices, payments, ratings, reviews, favorites, order history, wallet, notifications, disputes, support, referral program, coupons, promotions.

## Provider Features

Create/edit/delete services, manage prices, manage schedule/availability, accept/reject requests, chat, receive payments, withdraw funds, upload portfolio, manage gallery, analytics, performance dashboard, promotions, premium subscription, documents, verification, invoices, tax reports (future).

## On-Demand Workflow

Customer requests service → system finds nearby providers → providers notified → provider accepts → customer confirms → provider navigates using Maps → work begins → customer confirms completion → payment released → review.

## Contract Workflow

Customer creates project (description, budget, timeline, documents) → receive bids → compare proposals → select provider → contract generation → milestones → deliverables → final approval → payment completion → review.

## Remote Service Workflow

Customer posts request → providers submit proposals → customer selects provider → milestones → digital delivery → revision requests → approval → payment release → review.

## Messaging

Private chat, read receipts, typing indicator, voice messages, image sharing, document sharing, location sharing, system messages, push notifications.

## Notifications

Booking updates, provider acceptance, provider arrival, payment updates, promotions, system messages, support messages, verification updates, dispute updates, marketing notifications, notification preferences.

## Reviews

Customers rate providers; providers rate customers. Rating includes: stars, comment, photos (optional), categories (professionalism, communication, quality, punctuality, value), overall rating.

## Wallet

Deposit, withdrawal, refund, bonus, referral rewards, coupons, transaction history, invoices. Future: multiple currencies.

## Payment Flow

Customer initiates payment → funds held securely → provider completes work → customer confirms → funds released → commission deducted → provider receives balance.

## Dispute System

Customer opens dispute → provider responds → evidence upload → admin review → decision → refund or payment release → case archived.

## Support Center

FAQs, live chat (future), support tickets, knowledge base, feedback, bug reports, feature requests.

## Referral Program

Invite friends, referral code, reward tracking, referral wallet, campaign management.

## Business Accounts

Company profile, multiple employees, role management, company wallet, company analytics, bulk requests, company projects, invoice management.

## Accessibility

Large fonts, high contrast, RTL, LTR, screen reader support, accessible navigation.

## Offline Support

View cached data, draft requests, reconnect synchronization, retry uploads.

## Non-Functional Requirements

App startup under 3 seconds. API average response below 500ms under normal load. Responsive UI across phones and tablets. Support at least 10,000 concurrent users in initial architecture. Modular codebase with feature isolation. Comprehensive logging and monitoring. Automated testing support. Localization-ready for additional languages. Security-first design. Production-ready deployment pipeline.

Every feature implemented must satisfy four requirements: (1) easy to understand, (2) fast to use, (3) secure by default, (4) scalable without architectural changes.
