import type { PrismaClient } from "@prisma/client";
import type { PromotionalCampaign } from "@/domain/promotion/promotion.entity";
import type {
  CreatePromotionInput,
  PromotionRepository,
  SearchPromotionsFilter,
  UpdatePromotionInput,
} from "@/domain/promotion/promotion.repository";

export class PrismaPromotionRepository implements PromotionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreatePromotionInput): Promise<PromotionalCampaign> {
    return this.prisma.promotionalCampaign.create({
      data: {
        name: input.name,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        categoryId: input.categoryId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      },
    }) as unknown as Promise<PromotionalCampaign>;
  }

  async findById(id: string): Promise<PromotionalCampaign | null> {
    return this.prisma.promotionalCampaign.findUnique({ where: { id } }) as unknown as Promise<PromotionalCampaign | null>;
  }

  async update(id: string, input: UpdatePromotionInput): Promise<PromotionalCampaign> {
    return this.prisma.promotionalCampaign.update({ where: { id }, data: input as never }) as unknown as Promise<PromotionalCampaign>;
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.prisma.promotionalCampaign.update({ where: { id }, data: { isActive } });
  }

  async search(filter: SearchPromotionsFilter): Promise<PromotionalCampaign[]> {
    return this.prisma.promotionalCampaign.findMany({
      where: { isActive: filter.isActive },
      orderBy: { startsAt: "desc" },
      take: filter.limit ?? 50,
    }) as unknown as Promise<PromotionalCampaign[]>;
  }

  async findActive(now: Date, categoryId?: string): Promise<PromotionalCampaign[]> {
    return this.prisma.promotionalCampaign.findMany({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now }, categoryId: categoryId ?? undefined },
      orderBy: { startsAt: "desc" },
    }) as unknown as Promise<PromotionalCampaign[]>;
  }
}
