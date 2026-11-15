import type { MessageKey } from "@/presentation/i18n/en";

// Shapes returned by the SAHL API's /admin/service-categories endpoints
// (apps/api/app/routers/admin_categories.py).
export type CategoryType = "ON_DEMAND" | "REMOTE" | "CONTRACT";

export interface AdminCategory {
  id: string;
  type: CategoryType;
  isActive: boolean;
  createdAt: string;
  imageUrl: string | null;
  nameEn: string | null;
  nameAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  key: string | null;
  listingCount: number;
  providerCount: number;
}

export const CATEGORY_TYPES: CategoryType[] = ["ON_DEMAND", "REMOTE", "CONTRACT"];

export const CATEGORY_TYPE_KEYS: Record<CategoryType, MessageKey> = {
  ON_DEMAND: "categories.type.ON_DEMAND",
  REMOTE: "categories.type.REMOTE",
  CONTRACT: "categories.type.CONTRACT",
};

export const CATEGORY_ERROR_KEYS: Record<string, MessageKey> = {
  exists: "categories.error.exists",
  validation: "categories.error.validation",
  uploadsOff: "categories.error.uploadsOff",
  uploadFailed: "categories.error.uploadFailed",
  imageType: "categories.error.imageType",
  imageTooLarge: "categories.error.imageTooLarge",
  imageTooSmall: "categories.error.imageTooSmall",
  generic: "categories.error.generic",
};
