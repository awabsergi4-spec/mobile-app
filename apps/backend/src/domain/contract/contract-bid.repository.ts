export type BidStatus = "SUBMITTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

export interface ContractBid {
  id: string;
  projectId: string;
  providerId: string;
  amount: number;
  message: string | null;
  status: BidStatus;
  submittedAt: Date;
}

export interface CreateContractBidInput {
  projectId: string;
  providerId: string;
  amount: number;
  message?: string;
}

export interface ListByProviderFilter {
  status?: BidStatus;
  limit?: number;
}

// Interface only — implemented in infrastructure/contract/prisma-contract-bid.repository.ts.
export interface ContractBidRepository {
  create(input: CreateContractBidInput): Promise<ContractBid>;
  findById(id: string): Promise<ContractBid | null>;
  listByProjectId(projectId: string): Promise<ContractBid[]>;
  // What Flutter's provider-side "My Bids" list needs.
  listByProviderId(providerId: string, filter: ListByProviderFilter): Promise<ContractBid[]>;
  updateStatus(id: string, status: BidStatus): Promise<ContractBid>;
  // Bulk-rejects every other SUBMITTED bid on a project once one is
  // accepted — one call rather than a caller loop, mirroring
  // OnDemandAssignmentRepository.expirePendingOffers.
  rejectOtherSubmittedBids(projectId: string, exceptBidId: string): Promise<void>;
}
