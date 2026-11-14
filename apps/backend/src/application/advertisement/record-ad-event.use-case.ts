import type { AdEventType } from "@/domain/advertisement/advertisement.entity";
import type { AdvertisementRepository } from "@/domain/advertisement/advertisement.repository";
import { AdvertisementNotFoundError } from "./errors";

export interface RecordAdEventInput {
  advertisementId: string;
  type: AdEventType;
  userId?: string;
}

// Not audit-logged — this is routine analytics telemetry from any
// authenticated app user viewing/tapping an ad slot, not a privileged
// admin mutation. High-volume by design (see AdEvent's own schema
// comment); AuditLog is reserved for admin/financial actions.
export class RecordAdEventUseCase {
  constructor(private readonly ads: AdvertisementRepository) {}

  async execute(input: RecordAdEventInput): Promise<void> {
    const ad = await this.ads.findById(input.advertisementId);
    if (!ad) {
      throw new AdvertisementNotFoundError();
    }
    await this.ads.recordEvent(input.advertisementId, input.type, input.userId);
  }
}
