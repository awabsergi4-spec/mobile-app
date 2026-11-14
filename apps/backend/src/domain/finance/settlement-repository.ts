import type { SettlementSchedule, SettlementStatus } from "@prisma/client";

export interface SettlementRecord {
  id: string;
  schedule: SettlementSchedule;
  status: SettlementStatus;
  totalAmount: number;
  currency: string;
  scheduledFor: Date | null;
  processedAt: Date | null;
}

export interface CreateSettlementInput {
  schedule: SettlementSchedule;
  totalAmount: number;
  currency: string;
  scheduledFor?: Date;
}

export interface SettlementRepository {
  create(input: CreateSettlementInput): Promise<SettlementRecord>;
  findById(id: string): Promise<SettlementRecord | null>;
  listByStatus(status: SettlementStatus, filter?: { limit?: number }): Promise<SettlementRecord[]>;
  compareAndSetStatus(
    id: string,
    fromStatus: SettlementStatus,
    toStatus: SettlementStatus,
    details?: { processedAt?: Date },
  ): Promise<boolean>;
}
