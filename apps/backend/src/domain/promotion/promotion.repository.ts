import type { DiscountType, PromotionalCampaign } from "./promotion.entity";

export interface CreatePromotionInput {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  categoryId?: string;
  startsAt: Date;
  endsAt: Date;
}

export interface UpdatePromotionInput {
  name?: string;
  description?: string | null;
  discountType?: DiscountType;
  discountValue?: number;
  categoryId?: string | null;
  startsAt?: Date;
  endsAt?: Date;
}

export interface SearchPromotionsFilter {
  isActive?: boolean;
  limit?: number;
}

// Interface only — implemented in infrastructure/promotion/prisma-promotion.repository.ts.
export interface PromotionRepository {
  create(input: CreatePromotionInput): Promise<PromotionalCampaign>;
  findById(id: string): Promise<PromotionalCampaign | null>;
  update(id: string, input: UpdatePromotionInput): Promise<PromotionalCampaign>;
  setActive(id: string, isActive: boolean): Promise<void>;
  search(filter: SearchPromotionsFilter): Promise<PromotionalCampaign[]>;
  // Public, customer-facing lookup: only currently-live promotions
  // (isActive + within the startsAt/endsAt window), optionally scoped to a
  // single category — the query Flutter's promotions surface actually needs.
  findActive(now: Date, categoryId?: string): Promise<PromotionalCampaign[]>;
}
