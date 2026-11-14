import type { PromotionRepository } from "@/domain/promotion/promotion.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import { PromotionNotFoundError } from "./errors";

export interface SetPromotionActiveInput {
  promotionId: string;
  isActive: boolean;
  actorId: string;
}

export class SetPromotionActiveUseCase {
  constructor(
    private readonly promotions: PromotionRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: SetPromotionActiveInput): Promise<void> {
    const existing = await this.promotions.findById(input.promotionId);
    if (!existing) {
      throw new PromotionNotFoundError();
    }

    await this.promotions.setActive(input.promotionId, input.isActive);

    await this.auditLog.write({
      actorId: input.actorId,
      action: input.isActive ? "promotion.activate" : "promotion.deactivate",
      entityType: "PromotionalCampaign",
      entityId: input.promotionId,
    });
  }
}
