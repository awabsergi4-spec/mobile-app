# infrastructure/

Concrete implementations of `domain/` repository interfaces: Prisma repositories, Redis cache adapters, Cloudinary adapter, payment gateway adapters, FCM sender, Socket.IO emitters.

Rules:
- Implements `domain/*/*.repository.ts` interfaces — implementation classes are the only place `@prisma/client`, `ioredis`, etc. are imported.
- Swappable: a use case in `application/` must work unchanged if an infrastructure implementation is swapped (e.g. a different payment gateway adapter), per [ADR-001](../../../../docs/02-architecture.md#adr-001-locale--payment-abstraction).

See [docs/02-architecture.md](../../../../docs/02-architecture.md) §2.
