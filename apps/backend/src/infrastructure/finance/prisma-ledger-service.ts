import type { PrismaClient } from "@prisma/client";
import type {
  AccountBalance,
  JournalEntryRecord,
  JournalLineRecord,
  LedgerService,
  ListJournalEntriesFilter,
  PostJournalEntryInput,
} from "@/domain/finance/ledger-service";
import {
  JournalEntryAlreadyReversedError,
  JournalEntryNotFoundError,
  LedgerAccountCurrencyMismatchError,
  LedgerAccountInactiveError,
  LedgerAccountNotFoundError,
  UnbalancedJournalEntryError,
} from "@/domain/finance/ledger-service";

// Debit-normal account types carry balance = debits - credits;
// credit-normal types carry the opposite. Whoever calls getAccountBalance
// never has to know which is which — the account's own LedgerAccountType
// decides it, once, here.
const CREDIT_NORMAL_TYPES = new Set(["LIABILITY", "EQUITY", "REVENUE"]);

export class PrismaLedgerService implements LedgerService {
  constructor(private readonly prisma: PrismaClient) {}

  async postJournalEntry(input: PostJournalEntryInput): Promise<{ journalEntryId: string }> {
    if (input.idempotencyKey) {
      const existing = await this.prisma.journalEntry.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (existing) {
        return { journalEntryId: existing.id };
      }
    }

    this.assertBalanced(input);

    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { code: { in: input.lines.map((line) => line.ledgerAccountCode) } },
    });
    const accountByCode = new Map(accounts.map((account) => [account.code, account]));

    for (const line of input.lines) {
      const account = accountByCode.get(line.ledgerAccountCode);
      if (!account) {
        throw new LedgerAccountNotFoundError(line.ledgerAccountCode);
      }
      if (!account.isActive) {
        throw new LedgerAccountInactiveError(line.ledgerAccountCode);
      }
      if (account.currency !== line.currency) {
        throw new LedgerAccountCurrencyMismatchError(line.ledgerAccountCode, account.currency, line.currency);
      }
    }

    const entry = await this.prisma.journalEntry.create({
      data: {
        description: input.description,
        relatedEntityType: input.relatedEntityType as never,
        relatedEntityId: input.relatedEntityId,
        idempotencyKey: input.idempotencyKey,
        lines: {
          create: input.lines.map((line) => ({
            ledgerAccountId: accountByCode.get(line.ledgerAccountCode)!.id,
            direction: line.direction,
            amount: line.amount,
            currency: line.currency,
          })),
        },
      },
    });

    return { journalEntryId: entry.id };
  }

  async reverseJournalEntry(journalEntryId: string, reason: string): Promise<{ reversalJournalEntryId: string }> {
    const original = await this.prisma.journalEntry.findUnique({
      where: { id: journalEntryId },
      include: { lines: { include: { ledgerAccount: true } }, reversedBy: true },
    });
    if (!original) {
      throw new JournalEntryNotFoundError(journalEntryId);
    }
    if (original.reversedBy) {
      throw new JournalEntryAlreadyReversedError(journalEntryId);
    }

    const reversal = await this.prisma.journalEntry.create({
      data: {
        description: `Reversal of ${journalEntryId}: ${reason}`,
        relatedEntityType: original.relatedEntityType as never,
        relatedEntityId: original.relatedEntityId,
        reversalOfId: original.id,
        lines: {
          // Same accounts and amounts, every direction flipped — this is
          // what makes a reversal net the original to zero without
          // touching the original's own rows.
          create: original.lines.map((line) => ({
            ledgerAccountId: line.ledgerAccountId,
            direction: line.direction === "DEBIT" ? "CREDIT" : "DEBIT",
            amount: line.amount,
            currency: line.currency,
          })),
        },
      },
    });

    return { reversalJournalEntryId: reversal.id };
  }

  async getJournalEntry(journalEntryId: string): Promise<JournalEntryRecord | null> {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id: journalEntryId },
      include: { lines: { include: { ledgerAccount: true } } },
    });
    return entry ? this.toRecord(entry) : null;
  }

  async listJournalEntries(filter: ListJournalEntriesFilter): Promise<JournalEntryRecord[]> {
    const entries = await this.prisma.journalEntry.findMany({
      where: {
        relatedEntityType: filter.relatedEntityType as never,
        relatedEntityId: filter.relatedEntityId,
        lines: filter.ledgerAccountCode ? { some: { ledgerAccount: { code: filter.ledgerAccountCode } } } : undefined,
      },
      include: { lines: { include: { ledgerAccount: true } } },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 50,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    });
    return entries.map((entry) => this.toRecord(entry));
  }

  async getAccountBalance(ledgerAccountCode: string): Promise<AccountBalance> {
    const account = await this.prisma.ledgerAccount.findUnique({ where: { code: ledgerAccountCode } });
    if (!account) {
      throw new LedgerAccountNotFoundError(ledgerAccountCode);
    }

    const lines = await this.prisma.journalLine.findMany({ where: { ledgerAccountId: account.id } });
    let totalDebits = 0;
    let totalCredits = 0;
    for (const line of lines) {
      if (line.direction === "DEBIT") totalDebits += line.amount;
      else totalCredits += line.amount;
    }

    const balance = CREDIT_NORMAL_TYPES.has(account.type) ? totalCredits - totalDebits : totalDebits - totalCredits;

    return { ledgerAccountCode, currency: account.currency, totalDebits, totalCredits, balance };
  }

  async getAccountHistory(ledgerAccountCode: string, filter?: { limit?: number; cursor?: string }): Promise<JournalLineRecord[]> {
    const account = await this.prisma.ledgerAccount.findUnique({ where: { code: ledgerAccountCode } });
    if (!account) {
      throw new LedgerAccountNotFoundError(ledgerAccountCode);
    }

    const lines = await this.prisma.journalLine.findMany({
      where: { ledgerAccountId: account.id },
      orderBy: { id: "desc" },
      take: filter?.limit ?? 50,
      ...(filter?.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    });

    return lines.map((line) => ({
      id: line.id,
      ledgerAccountCode,
      direction: line.direction,
      amount: line.amount,
      currency: line.currency,
    }));
  }

  // The ADR-008 invariant, checked before anything is written — per
  // currency, since a multi-currency entry (rare, but the schema allows
  // it) balances independently within each currency, not across them.
  private assertBalanced(input: PostJournalEntryInput): void {
    const totalsByCurrency = new Map<string, { debits: number; credits: number }>();

    for (const line of input.lines) {
      const totals = totalsByCurrency.get(line.currency) ?? { debits: 0, credits: 0 };
      if (line.direction === "DEBIT") {
        totals.debits += line.amount;
      } else {
        totals.credits += line.amount;
      }
      totalsByCurrency.set(line.currency, totals);
    }

    for (const [currency, totals] of totalsByCurrency) {
      if (totals.debits !== totals.credits) {
        throw new UnbalancedJournalEntryError(currency, totals.debits, totals.credits);
      }
    }
  }

  private toRecord(entry: {
    id: string;
    description: string;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
    reversalOfId: string | null;
    createdAt: Date;
    lines: { id: string; direction: "DEBIT" | "CREDIT"; amount: number; currency: string; ledgerAccount: { code: string } }[];
  }): JournalEntryRecord {
    return {
      id: entry.id,
      description: entry.description,
      relatedEntityType: entry.relatedEntityType,
      relatedEntityId: entry.relatedEntityId,
      reversalOfId: entry.reversalOfId,
      createdAt: entry.createdAt,
      lines: entry.lines.map((line) => ({
        id: line.id,
        ledgerAccountCode: line.ledgerAccount.code,
        direction: line.direction,
        amount: line.amount,
        currency: line.currency,
      })),
    };
  }
}
