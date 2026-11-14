import type { Advertisement } from "@/domain/advertisement/advertisement.entity";
import type { AdvertisementRepository, UpdateAdvertisementInput } from "@/domain/advertisement/advertisement.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import { AdvertisementNotFoundError } from "./errors";

export interface UpdateAdvertisementUseCaseInput extends UpdateAdvertisementInput {
  advertisementId: string;
  actorId: string;
}

export class UpdateAdvertisementUseCase {
  constructor(
    private readonly ads: AdvertisementRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: UpdateAdvertisementUseCaseInput): Promise<Advertisement> {
    const { advertisementId, actorId, ...rest } = input;
    const existing = await this.ads.findById(advertisementId);
    if (!existing) {
      throw new AdvertisementNotFoundError();
    }

    const updated = await this.ads.update(advertisementId, rest);

    await this.auditLog.write({
      actorId,
      action: "advertisement.update",
      entityType: "Advertisement",
      entityId: advertisementId,
    });

    return updated;
  }
}
