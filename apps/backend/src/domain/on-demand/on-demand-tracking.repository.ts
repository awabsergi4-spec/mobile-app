export interface OnDemandTrackingPing {
  id: string;
  requestId: string;
  lat: number;
  lng: number;
  recordedAt: Date;
}

export interface RecordTrackingPingInput {
  requestId: string;
  lat: number;
  lng: number;
}

// Interface only — implemented in infrastructure/on-demand/prisma-on-demand-tracking.repository.ts.
export interface OnDemandTrackingRepository {
  record(input: RecordTrackingPingInput): Promise<OnDemandTrackingPing>;
  listByRequestId(requestId: string): Promise<OnDemandTrackingPing[]>;
}
