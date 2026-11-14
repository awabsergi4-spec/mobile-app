import type { AdEventType, AdPlacement, AdType, Advertisement } from "./advertisement.entity";

export interface CreateAdvertisementInput {
  adType: AdType;
  placement: AdPlacement;
  providerId?: string;
  categoryId?: string;
  title: string;
  description?: string;
  ctaText?: string;
  destinationUrl?: string;
  creativeUrl?: string;
  budgetMinorUnits?: number;
  currency?: string;
  targetingRules?: Record<string, unknown>;
  priority?: number;
  startsAt: Date;
  endsAt: Date;
}

export interface UpdateAdvertisementInput {
  adType?: AdType;
  placement?: AdPlacement;
  providerId?: string | null;
  categoryId?: string | null;
  title?: string;
  description?: string | null;
  ctaText?: string | null;
  destinationUrl?: string | null;
  creativeUrl?: string | null;
  budgetMinorUnits?: number | null;
  currency?: string | null;
  targetingRules?: Record<string, unknown> | null;
  priority?: number;
  startsAt?: Date;
  endsAt?: Date;
}

export interface SearchAdvertisementsFilter {
  placement?: AdPlacement;
  isActive?: boolean;
  limit?: number;
}

export interface AdEventCounts {
  impressions: number;
  clicks: number;
  conversions: number;
}

// Interface only — implemented in infrastructure/advertisement/prisma-advertisement.repository.ts.
export interface AdvertisementRepository {
  create(input: CreateAdvertisementInput): Promise<Advertisement>;
  findById(id: string): Promise<Advertisement | null>;
  update(id: string, input: UpdateAdvertisementInput): Promise<Advertisement>;
  setActive(id: string, isActive: boolean): Promise<void>;
  search(filter: SearchAdvertisementsFilter): Promise<Advertisement[]>;
  // Public, customer-facing lookup: only currently-live ads for a
  // placement (isActive + within the startsAt/endsAt window) — the query
  // Flutter's ad slot actually needs, never a raw admin search.
  findActiveForPlacement(placement: AdPlacement, now: Date): Promise<Advertisement[]>;
  recordEvent(advertisementId: string, type: AdEventType, userId?: string): Promise<void>;
  getEventCounts(advertisementId: string): Promise<AdEventCounts>;
}
