import type { Advertisement } from "@/domain/advertisement/advertisement.entity";
import type { AdvertisementRepository, CreateAdvertisementInput } from "@/domain/advertisement/advertisement.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";

export interface CreateAdvertisementUseCaseInput extends CreateAdvertisementInput {
  actorId: string;
}

// Advertisements are Admin-authored content (ADR-007: config over code) —
// created inactive by default at the schema level (isActive defaults to
// false), so publishing is always a deliberate second step
// (SetAdvertisementActiveUseCase), never implicit at creation time.
export class CreateAdvertisementUseCase {
  constructor(
    private readonly ads: AdvertisementRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: CreateAdvertisementUseCaseInput): Promise<Advertisement> {
    const { actorId, ...rest } = input;
    const ad = await this.ads.create(rest);

    await this.auditLog.write({
      actorId,
      action: "advertisement.create",
      entityType: "Advertisement",
      entityId: ad.id,
      metadata: { placement: ad.placement, adType: ad.adType },
    });

    return ad;
  }
}
