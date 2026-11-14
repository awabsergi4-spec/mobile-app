import type { PrismaClient } from "@prisma/client";
import type {
  ProviderPortfolioItem,
  ProviderPortfolioRepository,
  CreateProviderPortfolioItemInput,
} from "@/domain/provider/provider-portfolio.repository";

export class PrismaProviderPortfolioRepository implements ProviderPortfolioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateProviderPortfolioItemInput): Promise<ProviderPortfolioItem> {
    return this.prisma.providerPortfolioItem.create({
      data: {
        providerId: input.providerId,
        mediaUrl: input.mediaUrl,
        title: input.title,
        description: input.description,
      },
    });
  }

  async findById(id: string): Promise<ProviderPortfolioItem | null> {
    return this.prisma.providerPortfolioItem.findUnique({ where: { id } });
  }

  async listByProviderId(providerId: string): Promise<ProviderPortfolioItem[]> {
    return this.prisma.providerPortfolioItem.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.providerPortfolioItem.delete({ where: { id } });
  }
}
