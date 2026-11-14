import { randomUUID } from "crypto";
import type { EscrowStatus, WalletBucket, WithdrawalStatus, WithdrawalMethod, SettlementStatus, SettlementSchedule } from "@prisma/client";
import type {
  AccountBalance,
  JournalEntryRecord,
  JournalLineRecord,
  LedgerService,
  ListJournalEntriesFilter,
  PostJournalEntryInput,
} from "@/domain/finance/ledger-service";
import { LedgerAccountCurrencyMismatchError, LedgerAccountNotFoundError, UnbalancedJournalEntryError } from "@/domain/finance/ledger-service";
import type { WalletBalanceRecord, WalletRecord, WalletRepository, WalletTransactionRecord } from "@/domain/finance/wallet-repository";
import type { CreateEscrowInput, EscrowRecord, EscrowRepository } from "@/domain/finance/escrow-repository";
import { EscrowAlreadyFundedError } from "@/domain/finance/escrow-repository";
import type { RecordTransactionInput, TransactionRecord, TransactionRecorder } from "@/domain/finance/transaction-recorder";
import type { CommissionCalculator, CommissionResult, ResolveCommissionInput } from "@/domain/finance/commission-calculator";
import type { CreateWithdrawalInput, WithdrawalRecord, WithdrawalRepository } from "@/domain/finance/withdrawal-repository";
import type { CreateSettlementInput, SettlementRecord, SettlementRepository } from "@/domain/finance/settlement-repository";
import type { AuditLogEntry, AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher, PublishDomainEventInput } from "@/domain/workflow/domain-event-publisher";

// Mirrors the real per-currency double-entry invariant (assertBalanced in
// infrastructure/finance/prisma-ledger-service.ts) plus currency/account
// checks, so use-case-level tests actually exercise "an unbalanced entry
// is rejected" rather than trusting a use case that merely calls a no-op
// fake. Registered accounts default debit-normal unless marked otherwise.
export class FakeLedgerService implements LedgerService {
  private readonly entries = new Map<string, JournalEntryRecord>();
  private readonly byIdempotencyKey = new Map<string, string>();
  private readonly accounts = new Map<string, { currency: string; creditNormal: boolean }>();

  registerAccount(code: string, currency: string, creditNormal = false): void {
    this.accounts.set(code, { currency, creditNormal });
  }

  async postJournalEntry(input: PostJournalEntryInput): Promise<{ journalEntryId: string }> {
    if (input.idempotencyKey) {
      const existingId = this.byIdempotencyKey.get(input.idempotencyKey);
      if (existingId) {
        return { journalEntryId: existingId };
      }
    }

    const totalsByCurrency = new Map<string, { debits: number; credits: number }>();
    for (const line of input.lines) {
      const account = this.accounts.get(line.ledgerAccountCode);
      if (!account) {
        throw new LedgerAccountNotFoundError(line.ledgerAccountCode);
      }
      if (account.currency !== line.currency) {
        throw new LedgerAccountCurrencyMismatchError(line.ledgerAccountCode, account.currency, line.currency);
      }
      const totals = totalsByCurrency.get(line.currency) ?? { debits: 0, credits: 0 };
      if (line.direction === "DEBIT") totals.debits += line.amount;
      else totals.credits += line.amount;
      totalsByCurrency.set(line.currency, totals);
    }
    for (const [currency, totals] of totalsByCurrency) {
      if (totals.debits !== totals.credits) {
        throw new UnbalancedJournalEntryError(currency, totals.debits, totals.credits);
      }
    }

    const id = randomUUID();
    const entry: JournalEntryRecord = {
      id,
      description: input.description,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
      reversalOfId: null,
      createdAt: new Date(),
      lines: input.lines.map((line) => ({ id: randomUUID(), ...line })),
    };
    this.entries.set(id, entry);
    if (input.idempotencyKey) this.byIdempotencyKey.set(input.idempotencyKey, id);
    return { journalEntryId: id };
  }

  async reverseJournalEntry(journalEntryId: string, reason: string): Promise<{ reversalJournalEntryId: string }> {
    const original = this.entries.get(journalEntryId);
    if (!original) throw new Error("not found");
    const reversalId = randomUUID();
    const reversal: JournalEntryRecord = {
      id: reversalId,
      description: `Reversal of ${journalEntryId}: ${reason}`,
      relatedEntityType: original.relatedEntityType,
      relatedEntityId: original.relatedEntityId,
      reversalOfId: journalEntryId,
      createdAt: new Date(),
      lines: original.lines.map((line) => ({
        ...line,
        id: randomUUID(),
        direction: line.direction === "DEBIT" ? "CREDIT" : "DEBIT",
      })),
    };
    this.entries.set(reversalId, reversal);
    return { reversalJournalEntryId: reversalId };
  }

  async getJournalEntry(journalEntryId: string): Promise<JournalEntryRecord | null> {
    return this.entries.get(journalEntryId) ?? null;
  }

  async listJournalEntries(filter: ListJournalEntriesFilter): Promise<JournalEntryRecord[]> {
    return [...this.entries.values()].filter(
      (e) =>
        (!filter.relatedEntityType || e.relatedEntityType === filter.relatedEntityType) &&
        (!filter.relatedEntityId || e.relatedEntityId === filter.relatedEntityId),
    );
  }

  async getAccountBalance(ledgerAccountCode: string): Promise<AccountBalance> {
    const account = this.accounts.get(ledgerAccountCode);
    let totalDebits = 0;
    let totalCredits = 0;
    for (const entry of this.entries.values()) {
      for (const line of entry.lines) {
        if (line.ledgerAccountCode !== ledgerAccountCode) continue;
        if (line.direction === "DEBIT") totalDebits += line.amount;
        else totalCredits += line.amount;
      }
    }
    const balance = account?.creditNormal ? totalCredits - totalDebits : totalDebits - totalCredits;
    return { ledgerAccountCode, currency: account?.currency ?? "SDG", totalDebits, totalCredits, balance };
  }

  async getAccountHistory(ledgerAccountCode: string): Promise<JournalLineRecord[]> {
    const lines: JournalLineRecord[] = [];
    for (const entry of this.entries.values()) {
      for (const line of entry.lines) {
        if (line.ledgerAccountCode === ledgerAccountCode) lines.push(line);
      }
    }
    return lines;
  }
}

export class FakeWalletRepository implements WalletRepository {
  private readonly wallets = new Map<string, WalletRecord>();
  private readonly balances = new Map<string, Map<WalletBucket, number>>();
  readonly transactions: WalletTransactionRecord[] = [];

  seed(userId: string, currency = "SDG"): WalletRecord {
    const wallet: WalletRecord = { id: randomUUID(), userId, companyId: null, currency, isFrozen: false, frozenReason: null };
    this.wallets.set(wallet.id, wallet);
    this.balances.set(wallet.id, new Map());
    return wallet;
  }

  freeze(walletId: string): void {
    const wallet = this.wallets.get(walletId);
    if (wallet) wallet.isFrozen = true;
  }

  async getBalance(walletId: string, bucket: WalletBucket): Promise<number> {
    return this.balances.get(walletId)?.get(bucket) ?? 0;
  }

  async adjustBalance(walletId: string, bucket: WalletBucket, deltaMinorUnits: number): Promise<void> {
    const bucketMap = this.balances.get(walletId) ?? new Map();
    bucketMap.set(bucket, (bucketMap.get(bucket) ?? 0) + deltaMinorUnits);
    this.balances.set(walletId, bucketMap);
  }

  async tryDebitBalance(walletId: string, bucket: WalletBucket, amountMinorUnits: number): Promise<boolean> {
    const bucketMap = this.balances.get(walletId) ?? new Map();
    const current = bucketMap.get(bucket) ?? 0;
    if (current < amountMinorUnits) return false;
    bucketMap.set(bucket, current - amountMinorUnits);
    this.balances.set(walletId, bucketMap);
    return true;
  }

  async findById(walletId: string): Promise<WalletRecord | null> {
    return this.wallets.get(walletId) ?? null;
  }

  async findByUserId(userId: string): Promise<WalletRecord | null> {
    return [...this.wallets.values()].find((w) => w.userId === userId) ?? null;
  }

  async findByCompanyId(companyId: string): Promise<WalletRecord | null> {
    return [...this.wallets.values()].find((w) => w.companyId === companyId) ?? null;
  }

  async getOrCreateForUser(userId: string, currency: string): Promise<WalletRecord> {
    return (await this.findByUserId(userId)) ?? this.seed(userId, currency);
  }

  async getOrCreateForCompany(companyId: string, currency: string): Promise<WalletRecord> {
    const existing = await this.findByCompanyId(companyId);
    if (existing) return existing;
    const wallet: WalletRecord = { id: randomUUID(), userId: null, companyId, currency, isFrozen: false, frozenReason: null };
    this.wallets.set(wallet.id, wallet);
    this.balances.set(wallet.id, new Map());
    return wallet;
  }

  async listBalances(walletId: string): Promise<WalletBalanceRecord[]> {
    const bucketMap = this.balances.get(walletId) ?? new Map();
    return [...bucketMap.entries()].map(([bucket, amount]) => ({ bucket, amount }));
  }

  async listTransactions(): Promise<WalletTransactionRecord[]> {
    return this.transactions;
  }
}

export class FakeEscrowRepository implements EscrowRepository {
  private readonly byId = new Map<string, EscrowRecord>();
  private readonly byRelatedEntity = new Map<string, string>();

  async create(input: CreateEscrowInput): Promise<EscrowRecord> {
    const key = `${input.relatedEntityType}:${input.relatedEntityId}`;
    if (this.byRelatedEntity.has(key)) {
      throw new EscrowAlreadyFundedError();
    }
    const escrow: EscrowRecord = {
      id: randomUUID(),
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      amount: input.amount,
      currency: input.currency,
      status: "HELD",
      releasedAmount: 0,
      refundedAmount: 0,
      expiresAt: input.expiresAt ?? null,
    };
    this.byId.set(escrow.id, escrow);
    this.byRelatedEntity.set(key, escrow.id);
    return escrow;
  }

  async findById(escrowId: string): Promise<EscrowRecord | null> {
    return this.byId.get(escrowId) ?? null;
  }

  async findByRelatedEntity(relatedEntityType: string, relatedEntityId: string): Promise<EscrowRecord | null> {
    const id = this.byRelatedEntity.get(`${relatedEntityType}:${relatedEntityId}`);
    return id ? (this.byId.get(id) ?? null) : null;
  }

  async updateStatus(escrowId: string, status: EscrowStatus, timestamps?: { disputedAt?: Date }): Promise<void> {
    const escrow = this.byId.get(escrowId);
    if (!escrow) throw new Error("not found");
    escrow.status = status;
    void timestamps;
  }

  async applyRelease(
    escrowId: string,
    amount: number,
    expected: { status: EscrowStatus; releasedAmount: number },
    newStatus: EscrowStatus,
  ): Promise<boolean> {
    const escrow = this.byId.get(escrowId);
    if (!escrow || escrow.status !== expected.status || escrow.releasedAmount !== expected.releasedAmount) return false;
    escrow.releasedAmount += amount;
    escrow.status = newStatus;
    return true;
  }

  async applyRefund(
    escrowId: string,
    amount: number,
    expected: { status: EscrowStatus; refundedAmount: number },
    newStatus: EscrowStatus,
  ): Promise<boolean> {
    const escrow = this.byId.get(escrowId);
    if (!escrow || escrow.status !== expected.status || escrow.refundedAmount !== expected.refundedAmount) return false;
    escrow.refundedAmount += amount;
    escrow.status = newStatus;
    return true;
  }
}

export class FakeTransactionRecorder implements TransactionRecorder {
  private readonly byId = new Map<string, TransactionRecord>();
  private readonly byIdempotencyKey = new Map<string, string>();

  async record(input: RecordTransactionInput): Promise<{ transactionId: string }> {
    if (input.idempotencyKey) {
      const existingId = this.byIdempotencyKey.get(input.idempotencyKey);
      if (existingId) return { transactionId: existingId };
    }
    const id = randomUUID();
    const record: TransactionRecord = {
      id,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      status: input.status ?? "SUCCEEDED",
      journalEntryId: input.journalEntryId ?? null,
      gatewayProvider: input.gatewayProvider,
      gatewayRef: input.gatewayRef ?? null,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
    };
    this.byId.set(id, record);
    if (input.idempotencyKey) this.byIdempotencyKey.set(input.idempotencyKey, id);
    return { transactionId: id };
  }

  async findById(transactionId: string): Promise<TransactionRecord | null> {
    return this.byId.get(transactionId) ?? null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<TransactionRecord | null> {
    const id = this.byIdempotencyKey.get(idempotencyKey);
    return id ? (this.byId.get(id) ?? null) : null;
  }

  async findLatestByGatewayRef(gatewayRef: string): Promise<TransactionRecord | null> {
    const matches = [...this.byId.values()].filter((t) => t.gatewayRef === gatewayRef);
    return matches[matches.length - 1] ?? null;
  }

  async updateStatus(transactionId: string, status: TransactionRecord["status"]): Promise<void> {
    const record = this.byId.get(transactionId);
    if (record) record.status = status;
  }

  async findLatestByRelatedEntity(relatedEntityType: string, relatedEntityId: string, type?: RecordTransactionInput["type"]): Promise<TransactionRecord | null> {
    const matches = [...this.byId.values()].filter(
      (t) => t.relatedEntityType === relatedEntityType && t.relatedEntityId === relatedEntityId && (!type || t.type === type),
    );
    return matches[matches.length - 1] ?? null;
  }
}

// Scriptable rather than DB-rule-driven — application-layer tests care
// that the caller passes the resolved commission through correctly, not
// about precedence/clamping (that's covered directly against the real
// PrismaCommissionCalculator in infrastructure/finance/__tests__).
export class FakeCommissionCalculator implements CommissionCalculator {
  constructor(private readonly result: CommissionResult = { commissionAmount: 0, commissionPercentage: 10, ruleId: "rule-1" }) {}

  async resolve(input: ResolveCommissionInput): Promise<CommissionResult> {
    void input;
    return this.result;
  }
}

export class FakeWithdrawalRepository implements WithdrawalRepository {
  private readonly byId = new Map<string, WithdrawalRecord>();

  async create(input: CreateWithdrawalInput): Promise<WithdrawalRecord> {
    const withdrawal: WithdrawalRecord = {
      id: randomUUID(),
      providerId: input.providerId,
      walletId: input.walletId,
      amount: input.amount,
      feeMinorUnits: input.feeMinorUnits ?? 0,
      currency: input.currency,
      method: input.method,
      status: "REQUESTED",
      approvedById: null,
      rejectedReason: null,
      settlementId: null,
      requestedAt: new Date(),
      paidAt: null,
    };
    this.byId.set(withdrawal.id, withdrawal);
    return withdrawal;
  }

  async findById(id: string): Promise<WithdrawalRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async listByProviderId(providerId: string): Promise<WithdrawalRecord[]> {
    return [...this.byId.values()].filter((w) => w.providerId === providerId);
  }

  async listByStatus(status: WithdrawalStatus): Promise<WithdrawalRecord[]> {
    return [...this.byId.values()].filter((w) => w.status === status);
  }

  async compareAndSetStatus(
    id: string,
    fromStatus: WithdrawalStatus,
    toStatus: WithdrawalStatus,
    details?: { approvedById?: string; rejectedReason?: string; paidAt?: Date; settlementId?: string },
  ): Promise<boolean> {
    const withdrawal = this.byId.get(id);
    if (!withdrawal || withdrawal.status !== fromStatus) return false;
    withdrawal.status = toStatus;
    if (details?.approvedById) withdrawal.approvedById = details.approvedById;
    if (details?.rejectedReason) withdrawal.rejectedReason = details.rejectedReason;
    if (details?.paidAt) withdrawal.paidAt = details.paidAt;
    if (details?.settlementId) withdrawal.settlementId = details.settlementId;
    return true;
  }
}

export class FakeSettlementRepository implements SettlementRepository {
  private readonly byId = new Map<string, SettlementRecord>();

  async create(input: CreateSettlementInput): Promise<SettlementRecord> {
    const settlement: SettlementRecord = {
      id: randomUUID(),
      schedule: input.schedule,
      status: "PENDING",
      totalAmount: input.totalAmount,
      currency: input.currency,
      scheduledFor: input.scheduledFor ?? null,
      processedAt: null,
    };
    this.byId.set(settlement.id, settlement);
    return settlement;
  }

  async findById(id: string): Promise<SettlementRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async listByStatus(status: SettlementStatus): Promise<SettlementRecord[]> {
    return [...this.byId.values()].filter((s) => s.status === status);
  }

  async compareAndSetStatus(id: string, fromStatus: SettlementStatus, toStatus: SettlementStatus, details?: { processedAt?: Date }): Promise<boolean> {
    const settlement = this.byId.get(id);
    if (!settlement || settlement.status !== fromStatus) return false;
    settlement.status = toStatus;
    if (details?.processedAt) settlement.processedAt = details.processedAt;
    return true;
  }
}

export class FakeAuditLogWriter implements AuditLogWriter {
  readonly entries: AuditLogEntry[] = [];

  async write(entry: AuditLogEntry): Promise<void> {
    this.entries.push(entry);
  }
}

export class FakeDomainEventPublisher implements DomainEventPublisher {
  readonly published: PublishDomainEventInput[] = [];

  async publish(input: PublishDomainEventInput): Promise<{ eventId: string }> {
    this.published.push(input);
    return { eventId: randomUUID() };
  }
}

export type { WithdrawalMethod, SettlementSchedule };
