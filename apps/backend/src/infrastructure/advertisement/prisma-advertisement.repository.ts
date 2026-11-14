import type { PrismaClient } from "@prisma/client";
import type { AdEventType, Advertisement } from "@/domain/advertisement/advertisement.entity";
import type {
  AdEventCounts,
  AdvertisementRepository,
  CreateAdvertisementInput,
  SearchAdvertisementsFilter,
  UpdateAdvertisementInput,
} from "@/domain/advertisement/advertisement.repository";

export class PrismaAdvertisementRepository implements AdvertisementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateAdvertisementInput): Promise<Advertisement> {
    return this.prisma.advertisement.create({
      data: {
        adType: input.adType,
        placement: input.placement,
        providerId: input.providerId,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        ctaText: input.ctaText,
        destinationUrl: input.destinationUrl,
        creativeUrl: input.creativeUrl,
        budgetMinorUnits: input.budgetMinorUnits,
        currency: input.currency,
        targetingRules: input.targetingRules as never,
        priority: input.priority ?? 0,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      },
    }) as unknown as Promise<Advertisement>;
  }

  async findById(id: string): Promise<Advertisement | null> {
    return this.prisma.advertisement.findUnique({ where: { id } }) as unknown as Promise<Advertisement | null>;
  }

  async update(id: string, input: UpdateAdvertisementInput): Promise<Advertisement> {
    return this.prisma.advertisement.update({ where: { id }, data: input as never }) as unknown as Promise<Advertisement>;
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.prisma.advertisement.update({ where: { id }, data: { isActive } });
  }

  async search(filter: SearchAdvertisementsFilter): Promise<Advertisement[]> {
    return this.prisma.advertisement.findMany({
      where: { placement: filter.placement, isActive: filter.isActive },
      orderBy: [{ priority: "desc" }, { startsAt: "desc" }],
      take: filter.limit ?? 50,
    }) as unknown as Promise<Advertisement[]>;
  }

  async findActiveForPlacement(placement: Advertisement["placement"], now: Date): Promise<Advertisement[]> {
    return this.prisma.advertisement.findMany({
      where: { placement, isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { priority: "desc" },
    }) as unknown as Promise<Advertisement[]>;
  }

  async recordEvent(advertisementId: string, type: AdEventType, userId?: string): Promise<void> {
    await this.prisma.adEvent.create({ data: { advertisementId, type, userId } });
  }

  async getEventCounts(advertisementId: string): Promise<AdEventCounts> {
    const [impressions, clicks, conversions] = await Promise.all([
      this.prisma.adEvent.count({ where: { advertisementId, type: "IMPRESSION" } }),
      this.prisma.adEvent.count({ where: { advertisementId, type: "CLICK" } }),
      this.prisma.adEvent.count({ where: { advertisementId, type: "CONVERSION" } }),
    ]);
    return { impressions, clicks, conversions };
  }
}
