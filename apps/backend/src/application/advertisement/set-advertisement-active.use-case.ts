import type { AdvertisementRepository } from "@/domain/advertisement/advertisement.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import { AdvertisementNotFoundError } from "./errors";

export interface SetAdvertisementActiveInput {
  advertisementId: string;
  isActive: boolean;
  actorId: string;
}

export class SetAdvertisementActiveUseCase {
  constructor(
    private readonly ads: AdvertisementRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: SetAdvertisementActiveInput): Promise<void> {
    const existing = await this.ads.findById(input.advertisementId);
    if (!existing) {
      throw new AdvertisementNotFoundError();
    }

    await this.ads.setActive(input.advertisementId, input.isActive);

    await this.auditLog.write({
      actorId: input.actorId,
      action: input.isActive ? "advertisement.activate" : "advertisement.deactivate",
      entityType: "Advertisement",
      entityId: input.advertisementId,
    });
  }
}
