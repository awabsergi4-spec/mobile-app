export type OnDemandStatus = "SEARCHING" | "ASSIGNED" | "EN_ROUTE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

// INSTANT dispatches immediately; SCHEDULED reserves a future
// ProviderAvailabilitySlot instead — see ADR-003 (Scheduled is a mode of
// On-Demand, not a separate bounded context).
export type FulfillmentMode = "INSTANT" | "SCHEDULED";

export interface OnDemandRequest {
  id: string;
  customerId: string;
  companyId: string | null;
  categoryId: string;
  description: string;
  lat: number;
  lng: number;
  status: OnDemandStatus;
  fulfillmentMode: FulfillmentMode;
  scheduledFor: Date | null;
  isEmergency: boolean;
  createdAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
}
