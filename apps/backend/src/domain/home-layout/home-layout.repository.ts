import type { HomeLayoutBlock } from "./home-layout-block.entity";

// Interface only — implemented in infrastructure/home-layout/prisma-home-layout.repository.ts.
export interface HomeLayoutRepository {
  // Published, currently-live (startsAt/endsAt window), targeting-matched
  // blocks for the given user, ordered by position — the exact query
  // Flutter's home screen needs (ADR-007 "Dynamic Home Builder").
  findForUser(userId: string, now: Date): Promise<HomeLayoutBlock[]>;
}
