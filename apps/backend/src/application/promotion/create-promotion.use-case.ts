import type { PromotionalCampaign } from "@/domain/promotion/promotion.entity";
import type { CreatePromotionInput, PromotionRepository } from "@/domain/promotion/promotion.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";

export interface CreatePromotionUseCaseInput extends CreatePromotionInput {
  actorId: string;
}

// Promotions are Admin-authored content (ADR-007: config over code) —
// created inactive by default at the schema level, so publishing is always
// a deliberate second step (SetPromotionActiveUseCase).
export class CreatePromotionUseCase {
  constructor(
    private readonly promotions: PromotionRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: CreatePromotionUseCaseInput): Promise<PromotionalCampaign> {
    const { actorId, ...rest } = input;
    const promotion = await this.promotions.create(rest);

    await this.auditLog.write({
      actorId,
      action: "promotion.create",
      entityType: "PromotionalCampaign",
      entityId: promotion.id,
      metadata: { discountType: promotion.discountType, discountValue: promotion.discountValue },
    });

    return promotion;
  }
}
