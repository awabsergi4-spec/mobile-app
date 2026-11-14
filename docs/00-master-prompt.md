# SAHL Platform – Master Project Prompt v1.0

This is the original brief supplied for the project. All other documents in `docs/` derive from and elaborate on this.

## Role

You are a team of senior software engineers, product managers, UI/UX designers, solution architects, database architects, DevOps engineers, security specialists, QA engineers, and AI engineers.

You must think like a complete software company, not like a code generator.

Never skip planning. Never make assumptions without documenting them. Every decision must be scalable, maintainable, secure, production-ready, and well documented. Build this project exactly as if it will serve millions of users in the future.

## Project Overview

- **Project Name**: SAHL
- **Parent Company**: SAIR
- **Project Type**: National Digital Service Marketplace
- **Initial Target**: One country only. Architecture must support multiple countries, currencies, languages, and payment gateways without redesign.

## Vision

Build the largest digital services marketplace in the country. Later expand regionally. The platform connects customers with service providers through one intelligent ecosystem.

## Mission

Provide an easy, trusted, secure and intelligent platform where customers can request any service and providers can grow their business.

## Core Principle

The application must not behave like a directory. Instead, it should understand the user's need and intelligently recommend the best provider.

Example: User writes "My car stopped." → System understands Emergency, Vehicle, Towing → finds the best provider automatically.

## Supported Service Types

1. **On-Demand Services** — immediate (plumbing, electricity, mobile mechanic, towing, cleaning, delivery, moving, road assistance). Usually completed within one day. Uses GPS, real-time tracking.
2. **Contract Services** — long-term projects (construction, engineering, architecture, maintenance contracts, factories, consultation, legal firms). Weeks to months. Supports project posting, bidding, contracts, milestones, payments, files, documents.
3. **Remote Services** — no physical presence (programming, graphic design, translation, marketing, video editing, accounting, writing, training, consulting). Delivered digitally. Supports files, revisions, milestones, chat, video meetings.

## User Roles

Customer, Service Provider, Administrator, Super Administrator, Support Team, Moderator, Verification Officer, Finance Officer. Every user may become both Customer and Provider using one account.

## Platform Philosophy

Simple, Fast, Reliable, Secure, Professional, Minimal, Modern, Scalable.

## Supported Languages

Arabic, English. Must support RTL, LTR, instant language switching. All texts stored using localization files. Never hardcode UI text.

## Branding

- Brand Name: SAHL / Parent Brand: SAIR
- Primary Color: Orange
- Style: Modern, Clean, Professional, Friendly, Material Design 3
- Support Light Mode and Dark Mode, accessibility compliant, responsive

## Technology Stack

- Frontend Mobile: Flutter
- Backend: Next.js, TypeScript, Prisma ORM
- Database: PostgreSQL
- Cache: Redis
- Realtime: Socket.IO
- Storage: Cloudinary
- Authentication: JWT, Refresh Tokens, OTP
- Push Notifications: Firebase Cloud Messaging
- Maps: Google Maps
- Payments: Abstract Payment Layer — support adding country-specific gateways later without changing business logic

## Architecture Rules

Clean Architecture, SOLID, DDD where appropriate. Separate presentation, domain, application, infrastructure. Everything modular, no duplicated logic, every feature independently testable, every module documented.

## Security

Password hashing, OTP verification, rate limiting, audit logs, RBAC permission system, encrypted sensitive data, API validation, input sanitization, activity logs, fraud prevention, backups, disaster recovery planning.

## Business Model

Registration free. Service publishing free during launch. Customer requests free during launch. No mandatory subscription during MVP.

- Phase 1: Free launch.
- Phase 2: Small commissions, premium subscriptions, sponsored listings, verification badges, advertising.
- Phase 3: Enterprise plans, API access, business accounts, advanced analytics.

## Smart Matching Engine

Rank providers using: distance, availability, price, rating, response time, completed jobs, experience, verification status, cancellation rate, customer preferences. Algorithm must be modular and improve over time.

## Future AI Features

Natural language service search, automatic category detection, provider recommendation, fraud detection, demand forecasting, AI customer assistant, AI provider assistant, AI admin assistant.

## Long-Term Goal

Build the platform so future SAIR products can be added without rewriting the core architecture. Design for long-term growth, maintainability, and regional expansion.
