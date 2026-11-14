# SAHL — Phase 9: Workflow Engine & Business Process Orchestration

Eighth source brief. Consolidated into [ADR-009](02-architecture.md#13-adr-009-workflow-engine-as-cross-entity-orchestration-layer), [10-workflow-engine.md](10-workflow-engine.md), and the numbered docs; this file preserves the source text as delivered.

## Objective

Design and implement a true Business Process Engine (Camunda/Temporal/Uber Dispatch-style) coordinating users, services, contracts, payments, notifications, AI, admin actions, disputes, and future automation — not a status field. Must follow every existing ADR (Clean Architecture, DDD, Event Driven, Config Over Code, AI Ready, Enterprise First, Fully Auditable, Extensible). Business logic must never be scattered across controllers — the Workflow Engine is the single orchestration layer.

## Required Workflow Types

User Registration, Identity Verification (KYC), Provider Onboarding, Company Registration, Service Publishing, Service Approval, Booking, Short-Term Jobs, Long-Term Contracts, Remote Services, Milestone Projects, Escrow Lifecycle, Wallet Operations, Withdrawals, Refunds, Disputes, Ratings, Reports, AI Review, Admin Approval, Subscription Lifecycle, Promotions, Notifications, Maintenance Jobs.

## Workflow Definition

Every workflow supports: states, transitions, conditions, actions, events, timeouts, retries, compensating actions, rollback, cancellation, expiration, scheduling, priority, versioning, draft/published/disabled.

## Workflow Builder

Admin Platform includes a Workflow Builder: create, modify, enable/disable, version, clone, test, publish workflows — without code deployment whenever possible.

## Workflow Actions

Send Notification, Send Email, Create Escrow, Release Escrow, Create Wallet Transaction, Generate Invoice, Generate Contract, Assign Provider, AI Evaluation, Fraud Check, Create Audit Log, Schedule Job, Trigger Webhook, Call External API, Create Admin Task, Escalate Case, Generate Report.

## Workflow Events

Event-driven orchestration. Examples: BookingCreated, BookingAccepted, BookingCancelled, EscrowReleased, ContractSigned, MilestoneCompleted, WithdrawalApproved, RefundCompleted, DisputeOpened, DisputeResolved, SubscriptionRenewed, PromotionActivated. Every event must be immutable.

## State Machines

Every major entity has its own state machine. Examples: Booking, Contract, Escrow, Withdrawal, Subscription, Dispute, Verification, Service, Provider, Company, Wallet, Document, Notification.

## Automation Engine

Automation rules. Examples: IF provider inactive 90 days → suspend account; IF withdrawal > limit → require approval; IF dispute unresolved 14 days → escalate; IF milestone overdue → notify both parties.

## Scheduler

Integrate with BullMQ. Support delayed jobs, recurring jobs, cron jobs, retry policies, dead letter queues.

## Admin Controls

Everything configurable without code changes: workflow rules, timeouts, approval chains, retry counts, automation rules, escalation policies, notification templates, AI participation.

## AI Integration

Expose structured data for AI: workflow optimization, delay prediction, risk prediction, failure detection, recommendation, automation suggestions. Never couple workflows directly to AI providers.

## Deliverables

ADR (if needed), workflow architecture, database schema, domain models, workflow engine, state machines, event models, sequence diagrams, admin workflow builder design, API contracts, security model, testing strategy, future expansion strategy.

## Important

Not simple status fields — a production-grade Workflow & Business Process Engine capable of orchestrating every operation inside SAHL for millions of users.
