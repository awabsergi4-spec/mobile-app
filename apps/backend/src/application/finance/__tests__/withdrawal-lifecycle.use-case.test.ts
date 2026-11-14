import { describe, it, expect } from "vitest";
import { RequestWithdrawalUseCase } from "../request-withdrawal.use-case";
import { ApproveWithdrawalUseCase } from "../approve-withdrawal.use-case";
import { RejectWithdrawalUseCase } from "../reject-withdrawal.use-case";
import { MarkWithdrawalPaidUseCase } from "../mark-withdrawal-paid.use-case";
import { MarkWithdrawalFailedUseCase } from "../mark-withdrawal-failed.use-case";
import { InsufficientWalletBalanceError, InvalidWithdrawalStatusTransitionError, WalletFrozenError } from "../errors";
import { FakeLedgerService, FakeTransactionRecorder, FakeWalletRepository, FakeWithdrawalRepository, FakeAuditLogWriter, FakeDomainEventPublisher } from "./fakes";

function setup() {
  const wallets = new FakeWalletRepository();
  const withdrawals = new FakeWithdrawalRepository();
  const ledger = new FakeLedgerService();
  ledger.registerAccount("PROVIDER_WALLETS_PAYABLE", "SDG", true);
  ledger.registerAccount("CASH_AT_PAYMENT_PROVIDER", "SDG");
  const transactions = new FakeTransactionRecorder();
  const auditLog = new FakeAuditLogWriter();
  const events = new FakeDomainEventPublisher();
  const requestWithdrawal = new RequestWithdrawalUseCase(wallets, withdrawals, events);
  const approveWithdrawal = new ApproveWithdrawalUseCase(withdrawals, auditLog, events);
  const rejectWithdrawal = new RejectWithdrawalUseCase(withdrawals, wallets, auditLog, events);
  const markPaid = new MarkWithdrawalPaidUseCase(withdrawals, wallets, ledger, transactions, events);
  const markFailed = new MarkWithdrawalFailedUseCase(withdrawals, wallets, events);
  return { wallets, withdrawals, ledger, transactions, auditLog, events, requestWithdrawal, approveWithdrawal, rejectWithdrawal, markPaid, markFailed };
}

describe("RequestWithdrawalUseCase", () => {
  it("moves the requested amount from AVAILABLE to LOCKED, never letting it be spent twice", async () => {
    const { requestWithdrawal, wallets } = setup();
    const wallet = wallets.seed("provider-user-1");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 5000);

    const withdrawal = await requestWithdrawal.execute({
      providerId: "provider-1",
      walletId: wallet.id,
      amount: 5000,
      currency: "SDG",
      method: "BANK_TRANSFER",
    });

    expect(withdrawal.status).toBe("REQUESTED");
    expect(await wallets.getBalance(wallet.id, "AVAILABLE")).toBe(0);
    expect(await wallets.getBalance(wallet.id, "LOCKED")).toBe(5000);
  });

  it("rejects a withdrawal request exceeding the AVAILABLE balance", async () => {
    const { requestWithdrawal, wallets } = setup();
    const wallet = wallets.seed("provider-user-1");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 1000);

    await expect(
      requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 5000, currency: "SDG", method: "BANK_TRANSFER" }),
    ).rejects.toBeInstanceOf(InsufficientWalletBalanceError);
    expect(await wallets.getBalance(wallet.id, "AVAILABLE")).toBe(1000);
  });

  it("rejects a withdrawal request against a frozen wallet", async () => {
    const { requestWithdrawal, wallets } = setup();
    const wallet = wallets.seed("provider-user-1");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 5000);
    wallets.freeze(wallet.id);

    await expect(
      requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 5000, currency: "SDG", method: "BANK_TRANSFER" }),
    ).rejects.toBeInstanceOf(WalletFrozenError);
  });

  it("two concurrent withdrawal requests for the same balance cannot both succeed", async () => {
    const { requestWithdrawal, wallets } = setup();
    const wallet = wallets.seed("provider-user-1");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 5000);

    const [first, second] = await Promise.allSettled([
      requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 4000, currency: "SDG", method: "BANK_TRANSFER" }),
      requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 4000, currency: "SDG", method: "BANK_TRANSFER" }),
    ]);

    const outcomes = [first.status, second.status];
    expect(outcomes.filter((s) => s === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((s) => s === "rejected")).toHaveLength(1);
    expect(await wallets.getBalance(wallet.id, "AVAILABLE")).toBe(1000);
  });
});

describe("Withdrawal approval workflow", () => {
  it("approve records the approving admin and writes an AuditLog entry", async () => {
    const { requestWithdrawal, approveWithdrawal, withdrawals, auditLog, wallets } = setup();
    const wallet = wallets.seed("provider-user-1");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 5000);
    const withdrawal = await requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 5000, currency: "SDG", method: "BANK_TRANSFER" });

    await approveWithdrawal.execute({ withdrawalId: withdrawal.id, approvedById: "admin-1" });

    expect((await withdrawals.findById(withdrawal.id))?.status).toBe("APPROVED");
    expect(auditLog.entries).toContainEqual(expect.objectContaining({ actorId: "admin-1", action: "withdrawal.approve", entityId: withdrawal.id }));
  });

  it("reject releases the LOCKED hold back to AVAILABLE and writes an AuditLog entry", async () => {
    const { requestWithdrawal, rejectWithdrawal, withdrawals, auditLog, wallets } = setup();
    const wallet = wallets.seed("provider-user-1");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 5000);
    const withdrawal = await requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 5000, currency: "SDG", method: "BANK_TRANSFER" });

    await rejectWithdrawal.execute({ withdrawalId: withdrawal.id, rejectedById: "admin-1", reason: "bad bank details" });

    expect((await withdrawals.findById(withdrawal.id))?.status).toBe("REJECTED");
    expect(await wallets.getBalance(wallet.id, "AVAILABLE")).toBe(5000);
    expect(await wallets.getBalance(wallet.id, "LOCKED")).toBe(0);
    expect(auditLog.entries).toContainEqual(expect.objectContaining({ action: "withdrawal.reject" }));
  });

  it("rejects approving a withdrawal that isn't REQUESTED/PENDING_APPROVAL", async () => {
    const { requestWithdrawal, approveWithdrawal, withdrawals, wallets } = setup();
    const wallet = wallets.seed("provider-user-1");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 5000);
    const withdrawal = await requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 5000, currency: "SDG", method: "BANK_TRANSFER" });
    await withdrawals.compareAndSetStatus(withdrawal.id, "REQUESTED", "REJECTED");

    await expect(approveWithdrawal.execute({ withdrawalId: withdrawal.id, approvedById: "admin-1" })).rejects.toBeInstanceOf(
      InvalidWithdrawalStatusTransitionError,
    );
  });

  it("mark-paid only succeeds once a withdrawal reaches PROCESSING (i.e. batched into a Settlement)", async () => {
    const { requestWithdrawal, approveWithdrawal, markPaid, withdrawals, wallets } = setup();
    const wallet = wallets.seed("provider-user-1");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 5000);
    const withdrawal = await requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 5000, currency: "SDG", method: "BANK_TRANSFER" });
    await approveWithdrawal.execute({ withdrawalId: withdrawal.id, approvedById: "admin-1" });

    // Not yet PROCESSING (no Settlement batched it) — must be rejected,
    // not silently paid out.
    await expect(
      markPaid.execute({ withdrawalId: withdrawal.id, gatewayProvider: "mock", idempotencyKey: `withdrawal-paid:${withdrawal.id}` }),
    ).rejects.toBeInstanceOf(InvalidWithdrawalStatusTransitionError);

    await withdrawals.compareAndSetStatus(withdrawal.id, "APPROVED", "PROCESSING");
    await markPaid.execute({ withdrawalId: withdrawal.id, gatewayProvider: "mock", idempotencyKey: `withdrawal-paid:${withdrawal.id}` });

    expect((await withdrawals.findById(withdrawal.id))?.status).toBe("PAID");
    expect(await wallets.getBalance(wallet.id, "LOCKED")).toBe(0);
  });

  it("mark-paid is idempotent: a retried call with the same key doesn't move money twice", async () => {
    const { requestWithdrawal, approveWithdrawal, markPaid, withdrawals, wallets, ledger } = setup();
    const wallet = wallets.seed("provider-user-1");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 5000);
    const withdrawal = await requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 5000, currency: "SDG", method: "BANK_TRANSFER" });
    await approveWithdrawal.execute({ withdrawalId: withdrawal.id, approvedById: "admin-1" });
    await withdrawals.compareAndSetStatus(withdrawal.id, "APPROVED", "PROCESSING");
    const key = `withdrawal-paid:${withdrawal.id}`;

    await markPaid.execute({ withdrawalId: withdrawal.id, gatewayProvider: "mock", idempotencyKey: key });
    // A retry (double-click, queue redelivery) with the same deterministic
    // key must return cleanly without re-debiting or re-posting.
    await markPaid.execute({ withdrawalId: withdrawal.id, gatewayProvider: "mock", idempotencyKey: key });

    // Only PROVIDER_WALLETS_PAYABLE's debit side is exercised in this
    // isolated test (no matching release-side credit posted here) — what
    // matters is that the retry didn't post a second debit.
    expect((await ledger.getAccountBalance("PROVIDER_WALLETS_PAYABLE")).totalDebits).toBe(5000);
  });

  it("mark-failed releases the LOCKED hold back to AVAILABLE, same as reject", async () => {
    const { requestWithdrawal, approveWithdrawal, markFailed, withdrawals, wallets } = setup();
    const wallet = wallets.seed("provider-user-1");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 5000);
    const withdrawal = await requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 5000, currency: "SDG", method: "BANK_TRANSFER" });
    await approveWithdrawal.execute({ withdrawalId: withdrawal.id, approvedById: "admin-1" });
    await withdrawals.compareAndSetStatus(withdrawal.id, "APPROVED", "PROCESSING");

    await markFailed.execute({ withdrawalId: withdrawal.id, reason: "gateway rejected payout" });

    expect((await withdrawals.findById(withdrawal.id))?.status).toBe("FAILED");
    expect(await wallets.getBalance(wallet.id, "AVAILABLE")).toBe(5000);
  });
});
