import type { EscrowStatus } from "@prisma/client";

export interface EscrowRecord {
  id: string;
  relatedEntityType: string;
  relatedEntityId: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  releasedAmount: number;
  refundedAmount: number;
  expiresAt: Date | null;
}

export interface CreateEscrowInput {
  relatedEntityType: string;
  relatedEntityId: string;
  amount: number;
  currency: string;
  expiresAt?: Date;
}

// Thrown by the Prisma implementation when create() would violate the
// @@unique([relatedEntityType, relatedEntityId]) constraint — the DB-level
// backstop behind FundEscrowUseCase's own "does one already exist" check,
// so a race between two concurrent funding calls still surfaces as this
// error rather than a raw Prisma P2002.
export class EscrowAlreadyFundedError extends Error {
  constructor() {
    super("An escrow already exists for this business transaction");
  }
}

export interface EscrowRepository {
  create(input: CreateEscrowInput): Promise<EscrowRecord>;
  findById(escrowId: string): Promise<EscrowRecord | null>;
  findByRelatedEntity(relatedEntityType: string, relatedEntityId: string): Promise<EscrowRecord | null>;
  updateStatus(
    escrowId: string,
    status: EscrowStatus,
    timestamps?: { releasedAt?: Date; refundedAt?: Date; disputedAt?: Date },
  ): Promise<void>;
  // Optimistic-concurrency conditional update: the caller passes the
  // `status`/`releasedAmount` (or `refundedAmount`) it just read, and the
  // increment only commits if the row still matches that exact snapshot
  // — a single UPDATE ... WHERE id = ? AND status = ? AND releasedAmount = ?.
  // Two concurrent releases against the same escrow can't both win: the
  // second one's snapshot is stale the instant the first commits, so it
  // gets `false` back and must re-read and retry rather than silently
  // over-releasing. Same CAS shape as on-demand/contract's
  // compareAndSetStatus, extended to guard a running total, not just a
  // status enum.
  applyRelease(
    escrowId: string,
    amount: number,
    expected: { status: EscrowStatus; releasedAmount: number },
    newStatus: EscrowStatus,
  ): Promise<boolean>;
  applyRefund(
    escrowId: string,
    amount: number,
    expected: { status: EscrowStatus; refundedAmount: number },
    newStatus: EscrowStatus,
  ): Promise<boolean>;
}
