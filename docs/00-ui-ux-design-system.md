# SAHL Platform – UI/UX Design System Specification v1.0

Fourth source brief, alongside [00-master-prompt.md](00-master-prompt.md) (technical), [00-business-requirements.md](00-business-requirements.md) (business/product), and [00-functional-requirements.md](00-functional-requirements.md) (functional/user stories). Translated into engineering tokens and implemented in [08-design-system.md](08-design-system.md) / `apps/mobile/lib/core/theme/`; this file preserves the source text as delivered.

## Design Philosophy

SAHL must communicate simplicity, trust, speed, professionalism, modern technology. The interface reduces cognitive load; every screen answers "what is the next logical action for the user?"

## Design Principles

Mobile First · Minimal Design · Material Design 3 · Accessibility First · Performance First · Consistency Above Creativity · Touch Friendly · Responsive · Scalable · AI Ready.

## Brand Identity

App: SAHL. Parent: SAIR. Personality: Friendly, Professional, Reliable, Fast, Modern, Simple, Confident.

## Color System

| Role | Color | Hex | Used for |
|---|---|---|---|
| Primary | Orange | `#F57C00` | Primary buttons, important actions, highlights, loading indicators, primary FAB |
| Secondary | Dark Orange | `#E65100` | Pressed states, active tabs, charts, graphs |
| Accent | Amber | `#FFB300` | Promotions, offers, rewards, premium features |
| Success | Green | `#2E7D32` | Completed jobs, payment success, verification, approved |
| Warning | Amber | `#F9A825` | Alerts, pending items, important notices |
| Error | Red | `#D32F2F` | Failed payments, validation errors, danger actions |
| Information | Blue | `#1976D2` | Tips, updates, announcements |
| Background (light) | | `#FAFAFA` | |
| Background (dark) | | `#121212` | |
| Surface (light) | White | | |
| Surface (dark) | | `#1E1E1E` | |
| Text primary | | `#212121` | |
| Text secondary | | `#616161` | |
| Text disabled | | `#9E9E9E` | |

## Typography

English: Inter. Arabic: IBM Plex Sans Arabic (alternative: Cairo). Weight scale: Regular, Medium, SemiBold, Bold. Heading sizes: Display, Headline, Title, Body, Caption, Label. Typography must automatically switch according to language.

## Icons

Material Symbols Rounded. Filled for active state, outlined for inactive state. Never mix icon families.

## Elevation

Material 3 elevation system. Avoid heavy shadows. Prefer clean floating surfaces.

## Border Radius

Cards 16px · Dialogs 20px · Buttons 14px · Bottom Sheets 24px · Search Fields 16px · Images 12px.

## Spacing

Base grid 8px. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

## Animations

Short 150ms · Normal 250ms · Complex 350ms. Smooth easing. Avoid excessive animations. Animations must communicate state changes.

## Dark Mode

Every screen supports Light, Dark, System Theme. No screen should require redesign.

## Localization

Arabic, English. RTL, LTR, dynamic switching, pluralization, localized dates/numbers/currency/time.

## Navigation

Bottom Navigation: Home, Explore, Requests, Messages, Profile. FAB is context-dependent (Create Request, Create Service, New Project).

## Screen Inventory

Home Screen: search bar, location selector, quick categories, promotional banner, nearby providers, popular services, recently used, recommended providers, emergency services, featured providers, latest offers.

Search Screen: search field, voice search (future), filters, sort, category chips, provider cards, map view toggle, list view.

Provider Profile: cover image, profile photo, business information, rating, reviews, experience, certificates, gallery, services, availability, working hours, map, portfolio, book/message/call (optional) buttons.

Customer Dashboard: upcoming requests, current jobs, completed jobs, wallet, favorites, notifications, recent activity, promotions.

Provider Dashboard: today's requests, revenue, pending payments, calendar, analytics, performance, ratings, new messages, promotions, subscription, verification status.

Request Details: status timeline, chat, attachments, location, provider information, invoice, payment, support, cancel, complete.

Contract Project Screen: project details, milestones, documents, timeline, members, budget, invoices, payments, progress, activity feed.

Remote Service Screen: files, milestones, chat, video meeting (future), revision requests, deliverables, approval.

Wallet Screen: balance, transactions, withdraw, deposit, bonuses, referral rewards, coupons, invoices.

Notifications Screen: grouped by Today/Yesterday/This Week/Older; categories Orders/Payments/Marketing/Support/System.

Messages: conversation list, unread badge, search, attachments, voice messages, images, documents, typing indicator, read status.

Settings: language, theme, notifications, privacy, security, account, help, about, logout, delete account.

## Empty States

Every module needs a meaningful empty state (No Orders, No Messages, No Favorites, No Providers, No Notifications), each with: illustration, title, description, primary action.

## Error States

Network Error, Server Error, Payment Error, Location Error, Validation Error, Authentication Error — each with: explanation, retry, alternative action, support link.

## Loading States

Skeleton screens, progress indicators, lazy loading, infinite scroll, pull to refresh, optimistic UI updates.

## Accessibility

Minimum touch target 48×48dp. Color contrast compliant. Dynamic text scaling. Screen reader compatibility. Keyboard navigation (Web/Admin). Accessible labels. Focus indicators.

## UX Rules

Complete common actions within three taps whenever possible. Never ask for unnecessary information. Always show progress for long-running operations. Critical actions require confirmation. Destructive actions provide undo when possible. Forms save drafts automatically. Search tolerates spelling mistakes and partial keywords. Navigation must always make it obvious where the user is.

## Future UX Enhancements

AI conversational search, voice commands, smart suggestions, predictive search, context-aware recommendations, offline-first synchronization, personalized home screen, behavior-based recommendations.

## Design Quality Checklist

Every screen must satisfy: consistent spacing · Material Design 3 compliance · Arabic and English support · RTL/LTR compatibility · Light/Dark mode compatibility · accessible color contrast · responsive layout · fast rendering · smooth animations · clear visual hierarchy · minimal cognitive load · professional appearance.

No screen should be approved for development until all checklist items are satisfied.
