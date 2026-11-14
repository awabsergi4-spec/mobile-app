import type { WithdrawalMethod, WithdrawalStatus } from "@prisma/client";

export interface WithdrawalRecord {
  id: string;
  providerId: string;
  walletId: string;
  amount: number;
  feeMinorUnits: number;
  currency: string;
  method: WithdrawalMethod;
  status: WithdrawalStatus;
  approvedById: string | null;
  rejectedReason: string | null;
  settlementId: string | null;
  requestedAt: Date;
  paidAt: Date | null;
}

export interface CreateWithdrawalInput {
  providerId: string;
  walletId: string;
  amount: number;
  feeMinorUnits?: number;
  currency: string;
  method: WithdrawalMethod;
}

export interface WithdrawalRepository {
  create(input: CreateWithdrawalInput): Promise<WithdrawalRecord>;
  findById(id: string): Promise<WithdrawalRecord | null>;
  listByProviderId(providerId: string, filter?: { limit?: number; cursor?: string }): Promise<WithdrawalRecord[]>;
  listByStatus(status: WithdrawalStatus, filter?: { limit?: number; cursor?: string }): Promise<WithdrawalRecord[]>;
  // Same optimistic-CAS shape as OnDemandAssignmentRepository/
  // ContractProjectRepository.compareAndSetStatus — a withdrawal can't be
  // approved twice, or approved-then-rejected-concurrently, by two admins
  // acting at the same moment.
  compareAndSetStatus(
    id: string,
    fromStatus: WithdrawalStatus,
    toStatus: WithdrawalStatus,
    details?: { approvedById?: string; rejectedReason?: string; paidAt?: Date; settlementId?: string },
  ): Promise<boolean>;
}
