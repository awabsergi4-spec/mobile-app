# application/

Use cases that orchestrate `domain/` entities against repository **interfaces** (never concrete infrastructure).

Rules:
- Depends on `domain/` only — never imports `infrastructure/` or `presentation/` directly; repository implementations are injected.
- One use case = one file = one class/function with a single `execute()` entry point.

See [docs/02-architecture.md](../../../../docs/02-architecture.md) §2.
