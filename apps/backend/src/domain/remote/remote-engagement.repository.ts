import type { PriceType, RemoteEngagement, RemoteEngagementStatus } from "./remote-engagement.entity";

export interface CreateRemoteEngagementInput {
  customerId: string;
  providerId: string;
  categoryId: string;
  title: string;
  priceType: PriceType;
  amount: number;
  companyId?: string;
}

export interface SearchRemoteEngagementsFilter {
  status?: RemoteEngagementStatus;
  limit?: number;
  cursor?: string;
}

export interface ListByPartyFilter {
  status?: RemoteEngagementStatus;
  limit?: number;
}

// Interface only — implemented in infrastructure/remote/prisma-remote-engagement.repository.ts.
export interface RemoteEngagementRepository {
  create(input: CreateRemoteEngagementInput): Promise<RemoteEngagement>;
  findById(id: string): Promise<RemoteEngagement | null>;
  updateStatus(id: string, status: RemoteEngagementStatus, details?: { completedAt?: Date }): Promise<RemoteEngagement>;
  // Admin oversight only — never exposed to a customer/provider caller.
  search(filter: SearchRemoteEngagementsFilter): Promise<RemoteEngagement[]>;
  // What Flutter's customer/provider "My Engagements" lists need.
  listByCustomerId(customerId: string, filter: ListByPartyFilter): Promise<RemoteEngagement[]>;
  listByProviderId(providerId: string, filter: ListByPartyFilter): Promise<RemoteEngagement[]>;
}
