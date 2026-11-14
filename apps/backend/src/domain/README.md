# domain/

Entities, value objects, domain events, and repository **interfaces** only.

Rules:
- No imports from `next`, `@prisma/client`, `ioredis`, or any SDK.
- No I/O. Pure TypeScript, unit-testable with zero setup.
- One subfolder per bounded context (identity, provider, on-demand, contract, remote, payments, matching, chat, review), matching `application/` and `infrastructure/`.

See [docs/02-architecture.md](../../../../docs/02-architecture.md) §2.
