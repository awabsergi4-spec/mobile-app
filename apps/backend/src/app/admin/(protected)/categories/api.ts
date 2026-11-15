// Shapes returned by the SAHL API's /admin/service-categories endpoints
// (apps/api/app/routers/admin_categories.py).
export type CategoryType = "ON_DEMAND" | "REMOTE" | "CONTRACT";

export interface AdminCategory {
  id: string;
  type: CategoryType;
  isActive: boolean;
  createdAt: string;
  nameEn: string | null;
  nameAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  key: string | null;
  listingCount: number;
  providerCount: number;
}

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  ON_DEMAND: "On-Demand",
  REMOTE: "Short-Term (Remote)",
  CONTRACT: "Long-Term (Contract)",
};

export const CATEGORY_TYPES = Object.keys(CATEGORY_TYPE_LABELS) as CategoryType[];
