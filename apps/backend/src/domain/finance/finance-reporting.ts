// Interface only — read-only queries for reconciliation (Phase 15) and
// reporting (Phase 16). Deliberately separate from LedgerService/
// WalletRepository (which own writes and the single-account queries
// those use cases need): this interface answers cross-cutting "does
// everything still add up" and "give me a summary" questions no single
// use case needs, so it doesn't belong bolted onto either of them.
export interface TrialBalanceLine {
  ledgerAccountCode: string;
  ledgerAccountName: string;
  type: string;
  currency: string;
  totalDebits: number;
  totalCredits: number;
  balance: number;
}

export interface ReconciliationResult {
  currency: string;
  // What the subsidiary ledgers (WalletBalance rows / held Escrow rows)
  // say, versus what the general ledger's own control accounts say.
  // Discrepancy should always be 0 — a non-zero value means something
  // wrote to a WalletBalance/Escrow row without posting the matching
  // JournalEntry (or vice versa), and is reported, never silently
  // corrected (Financial Core Phase 15: "identify discrepancies rather
  // than silently correcting them").
  subsidiaryTotal: number;
  ledgerControlBalance: number;
  discrepancy: number;
  isReconciled: boolean;
}

export interface AccountStatementLine {
  journalEntryId: string;
  description: string;
  direction: "DEBIT" | "CREDIT";
  amount: number;
  createdAt: Date;
}

export interface FinanceReportingService {
  // Every active LedgerAccount with its balance — the classic accounting
  // report that proves total debits equal total credits platform-wide,
  // not just per entry.
  getTrialBalance(currency: string): Promise<TrialBalanceLine[]>;
  getAccountStatement(ledgerAccountCode: string, filter?: { limit?: number }): Promise<AccountStatementLine[]>;
  reconcileWalletBalances(currency: string): Promise<ReconciliationResult>;
  reconcileEscrowHoldings(currency: string): Promise<ReconciliationResult>;
}
