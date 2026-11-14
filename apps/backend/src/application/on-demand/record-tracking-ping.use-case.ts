import type { OnDemandRequestRepository } from "@/domain/on-demand/on-demand-request.repository";
import type { OnDemandTrackingPing, OnDemandTrackingRepository } from "@/domain/on-demand/on-demand-tracking.repository";
import { InvalidOnDemandStatusTransitionError, OnDemandRequestNotFoundError } from "./errors";

export interface RecordTrackingPingInput {
  requestId: string;
  lat: number;
  lng: number;
}

// Only meaningful while a provider is actually en route or on-site —
// pings outside that window would just be stale GPS noise on a request
// nobody is tracking.
const TRACKABLE_STATUSES = ["EN_ROUTE", "IN_PROGRESS"];

export class RecordTrackingPingUseCase {
  constructor(
    private readonly requests: OnDemandRequestRepository,
    private readonly tracking: OnDemandTrackingRepository,
  ) {}

  async execute(input: RecordTrackingPingInput): Promise<OnDemandTrackingPing> {
    const request = await this.requests.findById(input.requestId);
    if (!request) {
      throw new OnDemandRequestNotFoundError();
    }

    if (!TRACKABLE_STATUSES.includes(request.status)) {
      throw new InvalidOnDemandStatusTransitionError(request.status, "TRACKING_PING");
    }

    return this.tracking.record(input);
  }
}
