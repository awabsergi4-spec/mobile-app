import type { FulfillmentMode, OnDemandRequest, OnDemandStatus } from "./on-demand-request.entity";

export interface CreateOnDemandRequestInput {
  customerId: string;
  categoryId: string;
  description: string;
  lat: number;
  lng: number;
  companyId?: string;
  fulfillmentMode?: FulfillmentMode;
  scheduledFor?: Date;
  isEmergency?: boolean;
}

export interface SearchOnDemandRequestsFilter {
  status?: OnDemandStatus;
  limit?: number;
  cursor?: string;
}

export interface ListByCustomerFilter {
  status?: OnDemandStatus;
  limit?: number;
  cursor?: string;
}

// Interface only — implemented in infrastructure/on-demand/prisma-on-demand-request.repository.ts.
export interface OnDemandRequestRepository {
  create(input: CreateOnDemandRequestInput): Promise<OnDemandRequest>;
  findById(id: string): Promise<OnDemandRequest | null>;
  updateStatus(
    id: string,
    status: OnDemandStatus,
    details?: { completedAt?: Date; cancelledAt?: Date },
  ): Promise<OnDemandRequest>;
  // Admin oversight only — never exposed to a customer/provider caller.
  search(filter: SearchOnDemandRequestsFilter): Promise<OnDemandRequest[]>;
  // The customer's own request history (active + past) — what Flutter's
  // "My Requests" list actually needs, scoped server-side to `customerId`
  // so a caller can never see another customer's requests.
  listByCustomerId(customerId: string, filter: ListByCustomerFilter): Promise<OnDemandRequest[]>;
}
