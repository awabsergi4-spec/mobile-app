// Interface only — every financial use case posts money movements through
// this, never writing JournalEntry/JournalLine rows directly. See ADR-008
// in docs/02-architecture.md: the core invariant (sum(debits) ==
// sum(credits) per currency) is enforced by the implementation, once, so
// no caller can accidentally post an unbalanced entry.
export interface JournalLineInput {
  ledgerAccountCode: string; // resolves to LedgerAccount.code
  direction: "DEBIT" | "CREDIT";
  amount: number; // minor units
  currency: string;
}

export interface PostJournalEntryInput {
  description: string;
  lines: JournalLineInput[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  // Optional — when set, a second post with the same key returns the
  // already-posted entry instead of creating a duplicate. See
  // JournalEntry.idempotencyKey.
  idempotencyKey?: string;
}

export interface JournalLineRecord {
  id: string;
  ledgerAccountCode: string;
  direction: "DEBIT" | "CREDIT";
  amount: number;
  currency: string;
}

export interface JournalEntryRecord {
  id: string;
  description: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  reversalOfId: string | null;
  createdAt: Date;
  lines: JournalLineRecord[];
}

export interface AccountBalance {
  ledgerAccountCode: string;
  currency: string;
  totalDebits: number;
  totalCredits: number;
  // For ASSET/EXPENSE accounts this is debits-credits; for
  // LIABILITY/EQUITY/REVENUE it's credits-debits — the implementation
  // resolves the sign from LedgerAccount.type, callers never guess it.
  balance: number;
}

export interface ListJournalEntriesFilter {
  relatedEntityType?: string;
  relatedEntityId?: string;
  ledgerAccountCode?: string;
  limit?: number;
  cursor?: string;
}

export class UnbalancedJournalEntryError extends Error {
  constructor(currency: string, debits: number, credits: number) {
    super(`Unbalanced journal entry for ${currency}: debits=${debits} credits=${credits}`);
  }
}

export class LedgerAccountNotFoundError extends Error {
  constructor(code: string) {
    super(`Unknown LedgerAccount code: ${code}`);
  }
}

export class LedgerAccountCurrencyMismatchError extends Error {
  constructor(code: string, accountCurrency: string, lineCurrency: string) {
    super(`LedgerAccount ${code} is denominated in ${accountCurrency}, cannot post a ${lineCurrency} line to it`);
  }
}

export class LedgerAccountInactiveError extends Error {
  constructor(code: string) {
    super(`LedgerAccount ${code} is not active`);
  }
}

export class JournalEntryNotFoundError extends Error {
  constructor(journalEntryId: string) {
    super(`Journal entry ${journalEntryId} not found`);
  }
}

export class JournalEntryAlreadyReversedError extends Error {
  constructor(journalEntryId: string) {
    super(`Journal entry ${journalEntryId} has already been reversed`);
  }
}

export interface LedgerService {
  postJournalEntry(input: PostJournalEntryInput): Promise<{ journalEntryId: string }>;
  // Posts a new JournalEntry with every line's direction flipped and
  // reversalOfId set — corrections happen this way, never by mutating a
  // posted entry (immutability is the control, not a convention).
  reverseJournalEntry(journalEntryId: string, reason: string): Promise<{ reversalJournalEntryId: string }>;
  getJournalEntry(journalEntryId: string): Promise<JournalEntryRecord | null>;
  listJournalEntries(filter: ListJournalEntriesFilter): Promise<JournalEntryRecord[]>;
  getAccountBalance(ledgerAccountCode: string): Promise<AccountBalance>;
  getAccountHistory(ledgerAccountCode: string, filter?: { limit?: number; cursor?: string }): Promise<JournalLineRecord[]>;
}
