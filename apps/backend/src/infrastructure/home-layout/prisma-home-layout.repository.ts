import type { PrismaClient } from "@prisma/client";
import type { HomeLayoutBlock } from "@/domain/home-layout/home-layout-block.entity";
import type { HomeLayoutRepository } from "@/domain/home-layout/home-layout.repository";
import { matchesTargetingRules, type TargetingSubject } from "@/application/targeting/matches-targeting-rules";

export class PrismaHomeLayoutRepository implements HomeLayoutRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findForUser(userId: string, now: Date): Promise<HomeLayoutBlock[]> {
    const [user, blocks] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          country: true,
          city: true,
          preferredLanguage: true,
          providerProfile: { select: { companyId: true, categories: { select: { categoryId: true } } } },
        },
      }),
      this.prisma.homeLayoutBlock.findMany({
        where: {
          status: "PUBLISHED",
          isVisible: true,
          AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        orderBy: { position: "asc" },
      }),
    ]);

    if (!user) {
      return [];
    }

    const subject: TargetingSubject = {
      id: user.id,
      country: user.country,
      city: user.city,
      preferredLanguage: user.preferredLanguage,
      provider: user.providerProfile
        ? { companyId: user.providerProfile.companyId, categoryIds: user.providerProfile.categories.map((c) => c.categoryId) }
        : null,
    };

    return blocks
      .filter((block) => matchesTargetingRules(subject, block.targetingRules as Record<string, unknown> | null))
      .map((block) => ({
        id: block.id,
        type: block.type,
        position: block.position,
        config: block.config as Record<string, unknown>,
        isVisible: block.isVisible,
      }));
  }
}
