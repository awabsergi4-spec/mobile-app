import type { PrismaClient } from "@prisma/client";
import type { ServiceCategory } from "@/domain/service-category/service-category.entity";
import type { ListServiceCategoriesFilter, ServiceCategoryRepository } from "@/domain/service-category/service-category.repository";

export class PrismaServiceCategoryRepository implements ServiceCategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listActive(filter: ListServiceCategoriesFilter): Promise<ServiceCategory[]> {
    const categories = await this.prisma.serviceCategory.findMany({
      where: { isActive: true, type: filter.type },
      include: { translations: { where: { locale: { in: [filter.locale, "en"] } } } },
    });

    return categories.map((category) => {
      const translation =
        category.translations.find((t) => t.locale === filter.locale) ?? category.translations.find((t) => t.locale === "en");
      return {
        id: category.id,
        type: category.type,
        parentId: category.parentId,
        name: translation?.name ?? category.id,
        description: translation?.description ?? null,
      };
    });
  }
}
