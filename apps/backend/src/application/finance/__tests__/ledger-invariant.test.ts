import { describe, it, expect } from "vitest";
import { LedgerAccountCurrencyMismatchError, LedgerAccountNotFoundError, UnbalancedJournalEntryError } from "@/domain/finance/ledger-service";
import { FakeLedgerService } from "./fakes";

// FakeLedgerService.postJournalEntry ports the exact per-currency
// debits==credits check from infrastructure/finance/prisma-ledger-service.ts's
// assertBalanced (Financial Core Phase 1/2) — this exercises that
// invariant directly. Full DB-backed exercise of PrismaLedgerService
// itself is part of the Postgres integration pass (see Financial Core
// verification report) since it depends on a real ledger_account table.
describe("Ledger double-entry invariant", () => {
  it("posts a balanced entry (sum(debits) == sum(credits))", async () => {
    const ledger = new FakeLedgerService();
    ledger.registerAccount("CASH_AT_PAYMENT_PROVIDER", "SDG");
    ledger.registerAccount("ESCROW_HOLDING", "SDG", true);

    const { journalEntryId } = await ledger.postJournalEntry({
      description: "test",
      lines: [
        { ledgerAccountCode: "CASH_AT_PAYMENT_PROVIDER", direction: "DEBIT", amount: 5000, currency: "SDG" },
        { ledgerAccountCode: "ESCROW_HOLDING", direction: "CREDIT", amount: 5000, currency: "SDG" },
      ],
    });

    const entry = await ledger.getJournalEntry(journalEntryId);
    expect(entry?.lines).toHaveLength(2);
  });

  it("rejects an unbalanced entry (debits != credits)", async () => {
    const ledger = new FakeLedgerService();
    ledger.registerAccount("CASH_AT_PAYMENT_PROVIDER", "SDG");
    ledger.registerAccount("ESCROW_HOLDING", "SDG", true);

    await expect(
      ledger.postJournalEntry({
        description: "test",
        lines: [
          { ledgerAccountCode: "CASH_AT_PAYMENT_PROVIDER", direction: "DEBIT", amount: 5000, currency: "SDG" },
          { ledgerAccountCode: "ESCROW_HOLDING", direction: "CREDIT", amount: 4000, currency: "SDG" },
        ],
      }),
    ).rejects.toBeInstanceOf(UnbalancedJournalEntryError);
  });

  it("validates the debit==credit invariant independently per currency within one entry", async () => {
    const ledger = new FakeLedgerService();
    ledger.registerAccount("CASH_SDG", "SDG");
    ledger.registerAccount("HOLDING_SDG", "SDG", true);
    ledger.registerAccount("CASH_USD", "USD");
    ledger.registerAccount("HOLDING_USD", "USD", true);

    // Balanced in SDG (1000/1000) but NOT in USD (500 debit / 400 credit)
    // — the whole entry must be rejected, not just flagged per-line.
    await expect(
      ledger.postJournalEntry({
        description: "multi-currency test",
        lines: [
          { ledgerAccountCode: "CASH_SDG", direction: "DEBIT", amount: 1000, currency: "SDG" },
          { ledgerAccountCode: "HOLDING_SDG", direction: "CREDIT", amount: 1000, currency: "SDG" },
          { ledgerAccountCode: "CASH_USD", direction: "DEBIT", amount: 500, currency: "USD" },
          { ledgerAccountCode: "HOLDING_USD", direction: "CREDIT", amount: 400, currency: "USD" },
        ],
      }),
    ).rejects.toBeInstanceOf(UnbalancedJournalEntryError);
  });

  it("rejects a line posted against an unregistered LedgerAccount code", async () => {
    const ledger = new FakeLedgerService();
    await expect(
      ledger.postJournalEntry({
        description: "test",
        lines: [
          { ledgerAccountCode: "NOT_A_REAL_ACCOUNT", direction: "DEBIT", amount: 100, currency: "SDG" },
          { ledgerAccountCode: "ALSO_NOT_REAL", direction: "CREDIT", amount: 100, currency: "SDG" },
        ],
      }),
    ).rejects.toBeInstanceOf(LedgerAccountNotFoundError);
  });

  it("rejects a line whose currency doesn't match its LedgerAccount's currency", async () => {
    const ledger = new FakeLedgerService();
    ledger.registerAccount("CASH_AT_PAYMENT_PROVIDER", "SDG");
    ledger.registerAccount("ESCROW_HOLDING", "SDG", true);

    await expect(
      ledger.postJournalEntry({
        description: "test",
        lines: [
          { ledgerAccountCode: "CASH_AT_PAYMENT_PROVIDER", direction: "DEBIT", amount: 100, currency: "USD" },
          { ledgerAccountCode: "ESCROW_HOLDING", direction: "CREDIT", amount: 100, currency: "USD" },
        ],
      }),
    ).rejects.toBeInstanceOf(LedgerAccountCurrencyMismatchError);
  });

  it("is idempotent: posting twice with the same idempotencyKey returns the original entry, not a duplicate", async () => {
    const ledger = new FakeLedgerService();
    ledger.registerAccount("CASH_AT_PAYMENT_PROVIDER", "SDG");
    ledger.registerAccount("ESCROW_HOLDING", "SDG", true);
    const input = {
      description: "test",
      idempotencyKey: "post-1",
      lines: [
        { ledgerAccountCode: "CASH_AT_PAYMENT_PROVIDER" as const, direction: "DEBIT" as const, amount: 100, currency: "SDG" },
        { ledgerAccountCode: "ESCROW_HOLDING" as const, direction: "CREDIT" as const, amount: 100, currency: "SDG" },
      ],
    };

    const first = await ledger.postJournalEntry(input);
    const second = await ledger.postJournalEntry(input);

    expect(second.journalEntryId).toBe(first.journalEntryId);
    expect((await ledger.getAccountBalance("ESCROW_HOLDING")).balance).toBe(100);
  });

  it("reverses a posted entry by flipping every line's direction, never mutating the original", async () => {
    const ledger = new FakeLedgerService();
    ledger.registerAccount("CASH_AT_PAYMENT_PROVIDER", "SDG");
    ledger.registerAccount("ESCROW_HOLDING", "SDG", true);
    const { journalEntryId } = await ledger.postJournalEntry({
      description: "original",
      lines: [
        { ledgerAccountCode: "CASH_AT_PAYMENT_PROVIDER", direction: "DEBIT", amount: 100, currency: "SDG" },
        { ledgerAccountCode: "ESCROW_HOLDING", direction: "CREDIT", amount: 100, currency: "SDG" },
      ],
    });
    expect((await ledger.getAccountBalance("ESCROW_HOLDING")).balance).toBe(100);

    const { reversalJournalEntryId } = await ledger.reverseJournalEntry(journalEntryId, "correction");

    const original = await ledger.getJournalEntry(journalEntryId);
    expect(original?.lines.map((l) => l.direction)).toEqual(["DEBIT", "CREDIT"]);
    const reversal = await ledger.getJournalEntry(reversalJournalEntryId);
    expect(reversal?.lines.map((l) => l.direction)).toEqual(["CREDIT", "DEBIT"]);
    expect((await ledger.getAccountBalance("ESCROW_HOLDING")).balance).toBe(0);
  });
});
