export type DiscountType = "PERCENTAGE" | "FLAT";

export interface PromotionalCampaign {
  id: string;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  categoryId: string | null;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
}
