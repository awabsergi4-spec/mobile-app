import type { TransactionStatus, TransactionType } from "@prisma/client";

// PaymentTransaction.journalEntryId is 1:1 (unique) — see ADR-008: a
// business event that splits money multiple ways records one JournalEntry
// PER PaymentTransaction (each independently balanced), not one shared
// entry across several transactions. Callers must post a journal entry
// per transaction they intend to record here.
export interface RecordTransactionInput {
  type: TransactionType;
  amount: number;
  currency: string;
  gatewayProvider: string;
  gatewayRef?: string;
  status?: TransactionStatus; // defaults to SUCCEEDED — set explicitly for PENDING/HELD/FAILED transactions
  sourceWalletId?: string;
  destinationWalletId?: string;
  journalEntryId?: string;
  reason?: string;
  relatedEntityType: string;
  relatedEntityId: string;
  // Financial Core Phase 11 — a retried call with the same key returns
  // the already-recorded transaction instead of creating a duplicate.
  // See PaymentTransaction.idempotencyKey.
  idempotencyKey?: string;
}

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  journalEntryId: string | null;
  gatewayProvider: string;
  gatewayRef: string | null;
  relatedEntityType: string;
  relatedEntityId: string;
}

export interface TransactionRecorder {
  record(input: RecordTransactionInput): Promise<{ transactionId: string }>;
  findById(transactionId: string): Promise<TransactionRecord | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<TransactionRecord | null>;
  // Used by the payment webhook route to locate the transaction a
  // PAYMENT_SUCCEEDED/FAILED/REVERSED event refers to. Picks the most
  // recent match since a gatewayRef can, in principle, be reused across
  // an original DEPOSIT and a later reference to it.
  findLatestByGatewayRef(gatewayRef: string): Promise<TransactionRecord | null>;
  updateStatus(transactionId: string, status: TransactionStatus): Promise<void>;
  // Used to trace back from an Escrow to the PaymentTransaction that
  // funded it (type ESCROW_HOLD), so a later refund can retrieve the
  // original gatewayRef to call the gateway's refund API against.
  findLatestByRelatedEntity(relatedEntityType: string, relatedEntityId: string, type?: TransactionType): Promise<TransactionRecord | null>;
}
