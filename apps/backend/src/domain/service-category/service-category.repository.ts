import type { ServiceCategory, ServiceType } from "./service-category.entity";

export interface ListServiceCategoriesFilter {
  type?: ServiceType;
  locale: string;
}

// Interface only — implemented in infrastructure/service-category/prisma-service-category.repository.ts.
export interface ServiceCategoryRepository {
  // Active categories with the translation resolved for `locale`, falling
  // back to English when a translation is missing for the requested
  // locale — never returns a category with no name at all.
  listActive(filter: ListServiceCategoriesFilter): Promise<ServiceCategory[]>;
}
