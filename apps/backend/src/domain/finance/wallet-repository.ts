import type { WalletBucket } from "@prisma/client";

export interface WalletRecord {
  id: string;
  userId: string | null;
  companyId: string | null;
  currency: string;
  isFrozen: boolean;
  frozenReason: string | null;
}

export interface WalletBalanceRecord {
  bucket: WalletBucket;
  amount: number;
}

export interface WalletTransactionRecord {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  direction: "IN" | "OUT"; // relative to the wallet this statement was requested for
  relatedEntityType: string;
  relatedEntityId: string;
  createdAt: Date;
}

// Interface only — application-layer use cases read/adjust bucketed wallet
// balances through this, never touching WalletBalance rows directly.
// A Wallet is keyed by User (not by ProviderProfile) per ADR-004's "one
// identity, dual role": a person's customer and provider activity share
// one Wallet, distinguished only by which bucket a balance sits in
// (REWARD/CASHBACK are customer-facing, BONUS/INCENTIVE are provider-
// facing, AVAILABLE/PENDING/LOCKED apply to both) — never a second wallet
// per role.
export interface WalletRepository {
  getBalance(walletId: string, bucket: WalletBucket): Promise<number>;
  adjustBalance(walletId: string, bucket: WalletBucket, deltaMinorUnits: number): Promise<void>;
  // Atomic conditional adjustment — fails (returns false) rather than
  // letting a bucket go negative. Used for anything that spends
  // AVAILABLE funds (withdrawal requests, locking funds for a pending
  // operation) where two concurrent spends of the same balance must not
  // both succeed. See domain/on-demand's compareAndSetStatus for the
  // same "atomic conditional DB write, not read-then-write" reasoning.
  tryDebitBalance(walletId: string, bucket: WalletBucket, amountMinorUnits: number): Promise<boolean>;
  findById(walletId: string): Promise<WalletRecord | null>;
  findByUserId(userId: string): Promise<WalletRecord | null>;
  findByCompanyId(companyId: string): Promise<WalletRecord | null>;
  getOrCreateForUser(userId: string, currency: string): Promise<WalletRecord>;
  getOrCreateForCompany(companyId: string, currency: string): Promise<WalletRecord>;
  listBalances(walletId: string): Promise<WalletBalanceRecord[]>;
  listTransactions(walletId: string, filter?: { limit?: number; cursor?: string }): Promise<WalletTransactionRecord[]>;
}
