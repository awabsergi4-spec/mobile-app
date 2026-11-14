export type AdType = "BANNER" | "NATIVE" | "SPONSORED_PROVIDER" | "SPONSORED_SERVICE" | "SPONSORED_CATEGORY";
export type AdPlacement = "SEARCH_TOP" | "CATEGORY_BANNER" | "PROVIDER_FEATURED";
export type AdEventType = "IMPRESSION" | "CLICK" | "CONVERSION";

export interface Advertisement {
  id: string;
  adType: AdType;
  placement: AdPlacement;
  providerId: string | null;
  categoryId: string | null;
  title: string;
  description: string | null;
  ctaText: string | null;
  destinationUrl: string | null;
  creativeUrl: string | null;
  budgetMinorUnits: number | null;
  currency: string | null;
  targetingRules: Record<string, unknown> | null;
  priority: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
}
