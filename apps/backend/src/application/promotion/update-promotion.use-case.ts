import type { PromotionalCampaign } from "@/domain/promotion/promotion.entity";
import type { PromotionRepository, UpdatePromotionInput } from "@/domain/promotion/promotion.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import { PromotionNotFoundError } from "./errors";

export interface UpdatePromotionUseCaseInput extends UpdatePromotionInput {
  promotionId: string;
  actorId: string;
}

export class UpdatePromotionUseCase {
  constructor(
    private readonly promotions: PromotionRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: UpdatePromotionUseCaseInput): Promise<PromotionalCampaign> {
    const { promotionId, actorId, ...rest } = input;
    const existing = await this.promotions.findById(promotionId);
    if (!existing) {
      throw new PromotionNotFoundError();
    }

    const updated = await this.promotions.update(promotionId, rest);

    await this.auditLog.write({
      actorId,
      action: "promotion.update",
      entityType: "PromotionalCampaign",
      entityId: promotionId,
    });

    return updated;
  }
}
