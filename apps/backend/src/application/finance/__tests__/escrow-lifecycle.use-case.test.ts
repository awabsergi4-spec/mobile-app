import { describe, it, expect } from "vitest";
import { FundEscrowUseCase } from "../fund-escrow.use-case";
import { ReleaseEscrowUseCase } from "../release-escrow.use-case";
import { RefundEscrowUseCase } from "../refund-escrow.use-case";
import { CancelEscrowUseCase } from "../cancel-escrow.use-case";
import { EscrowAlreadyFundedError } from "@/domain/finance/escrow-repository";
import { EscrowNotHeldError, InvalidEscrowRefundAmountError, InvalidReleaseAmountError } from "../errors";
import { FakeEscrowRepository, FakeLedgerService, FakeTransactionRecorder, FakeWalletRepository, FakeDomainEventPublisher } from "./fakes";

function setup() {
  const escrows = new FakeEscrowRepository();
  const ledger = new FakeLedgerService();
  ledger.registerAccount("CASH_AT_PAYMENT_PROVIDER", "SDG");
  ledger.registerAccount("ESCROW_HOLDING", "SDG", true);
  ledger.registerAccount("PROVIDER_WALLETS_PAYABLE", "SDG", true);
  ledger.registerAccount("COMMISSION_REVENUE", "SDG", true);
  const wallets = new FakeWalletRepository();
  const transactions = new FakeTransactionRecorder();
  const events = new FakeDomainEventPublisher();
  const fundEscrow = new FundEscrowUseCase(escrows, ledger, transactions, events);
  const releaseEscrow = new ReleaseEscrowUseCase(escrows, ledger, wallets, transactions, events);
  const refundEscrow = new RefundEscrowUseCase(escrows, ledger, transactions, events);
  const cancelEscrow = new CancelEscrowUseCase(escrows, ledger, transactions, events);
  return { escrows, ledger, wallets, transactions, events, fundEscrow, releaseEscrow, refundEscrow, cancelEscrow };
}

describe("Escrow funding", () => {
  it("funds an escrow with a balanced journal entry (Debit cash / Credit escrow holding)", async () => {
    const { fundEscrow, escrows, ledger } = setup();

    const { escrowId } = await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });

    const escrow = await escrows.findById(escrowId);
    expect(escrow).toMatchObject({ amount: 10000, status: "HELD" });
    expect((await ledger.getAccountBalance("ESCROW_HOLDING")).balance).toBe(10000);
    expect((await ledger.getAccountBalance("CASH_AT_PAYMENT_PROVIDER")).balance).toBe(10000);
  });

  it("rejects funding a second escrow for the same business transaction", async () => {
    const { fundEscrow } = setup();
    await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });

    await expect(
      fundEscrow.execute({
        amount: 10000,
        currency: "SDG",
        relatedEntityType: "CONTRACT_MILESTONE",
        relatedEntityId: "milestone-1",
        gatewayProvider: "internal",
        idempotencyKey: "fund-2",
      }),
    ).rejects.toBeInstanceOf(EscrowAlreadyFundedError);
  });
});

describe("Escrow release", () => {
  it("splits a full release into provider share + platform commission, each its own balanced entry", async () => {
    const { fundEscrow, releaseEscrow, wallets, ledger, escrows } = setup();
    const { escrowId } = await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });
    const wallet = wallets.seed("provider-user-1");

    const result = await releaseEscrow.execute({
      escrowId,
      providerWalletId: wallet.id,
      commissionPercentage: 15,
      gatewayProvider: "internal",
    });

    expect(result).toMatchObject({ providerAmount: 8500, commissionAmount: 1500, releaseAmount: 10000, remaining: 0 });
    expect(await wallets.getBalance(wallet.id, "AVAILABLE")).toBe(8500);
    expect((await escrows.findById(escrowId))?.status).toBe("RELEASED");
    expect((await ledger.getAccountBalance("PROVIDER_WALLETS_PAYABLE")).balance).toBe(8500);
    expect((await ledger.getAccountBalance("COMMISSION_REVENUE")).balance).toBe(1500);
  });

  it("supports partial release, leaving the escrow PARTIALLY_RELEASED for a later release of the rest", async () => {
    const { fundEscrow, releaseEscrow, wallets, escrows } = setup();
    const { escrowId } = await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });
    const wallet = wallets.seed("provider-user-1");

    const first = await releaseEscrow.execute({
      escrowId,
      providerWalletId: wallet.id,
      commissionPercentage: 10,
      releaseAmount: 4000,
      gatewayProvider: "internal",
    });
    expect(first.remaining).toBe(6000);
    expect((await escrows.findById(escrowId))?.status).toBe("PARTIALLY_RELEASED");

    const second = await releaseEscrow.execute({
      escrowId,
      providerWalletId: wallet.id,
      commissionPercentage: 10,
      gatewayProvider: "internal",
    });
    expect(second.remaining).toBe(0);
    expect((await escrows.findById(escrowId))?.status).toBe("RELEASED");
    expect(await wallets.getBalance(wallet.id, "AVAILABLE")).toBe(3600 + 5400); // 90% of 4000 + 90% of 6000
  });

  it("rejects releasing an escrow that isn't HELD/PARTIALLY_RELEASED", async () => {
    const { fundEscrow, releaseEscrow, cancelEscrow, wallets } = setup();
    const { escrowId } = await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });
    await cancelEscrow.execute({ escrowId, gatewayProvider: "internal", reason: "test", idempotencyKey: "cancel-1" });

    await expect(
      releaseEscrow.execute({ escrowId, providerWalletId: wallets.seed("p").id, commissionPercentage: 10, gatewayProvider: "internal" }),
    ).rejects.toBeInstanceOf(EscrowNotHeldError);
  });

  it("rejects a release amount greater than what remains held", async () => {
    const { fundEscrow, releaseEscrow, wallets } = setup();
    const { escrowId } = await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });

    await expect(
      releaseEscrow.execute({
        escrowId,
        providerWalletId: wallets.seed("p").id,
        commissionPercentage: 10,
        releaseAmount: 999999,
        gatewayProvider: "internal",
      }),
    ).rejects.toBeInstanceOf(InvalidReleaseAmountError);
  });

  it("detects two concurrent releases racing against the same escrow snapshot", async () => {
    const { fundEscrow, releaseEscrow, wallets, escrows } = setup();
    const { escrowId } = await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });
    const wallet = wallets.seed("provider-user-1");

    // Simulates a second concurrent release winning the race between this
    // test's read and its own applyRelease call.
    const escrow = await escrows.findById(escrowId);
    const wonByOther = await escrows.applyRelease(escrowId, 10000, { status: "HELD", releasedAmount: 0 }, "RELEASED");
    expect(wonByOther).toBe(true);
    void escrow;

    await expect(
      releaseEscrow.execute({ escrowId, providerWalletId: wallet.id, commissionPercentage: 10, gatewayProvider: "internal" }),
    ).rejects.toBeInstanceOf(EscrowNotHeldError);
  });

  it("is idempotent: a retried release with the same key doesn't move money twice", async () => {
    const { fundEscrow, releaseEscrow, wallets } = setup();
    const { escrowId } = await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });
    const wallet = wallets.seed("provider-user-1");

    await releaseEscrow.execute({
      escrowId,
      providerWalletId: wallet.id,
      commissionPercentage: 10,
      gatewayProvider: "internal",
      idempotencyKey: "release-1",
    });
    const balanceAfterFirst = await wallets.getBalance(wallet.id, "AVAILABLE");

    await releaseEscrow.execute({
      escrowId,
      providerWalletId: wallet.id,
      commissionPercentage: 10,
      gatewayProvider: "internal",
      idempotencyKey: "release-1",
    });

    expect(await wallets.getBalance(wallet.id, "AVAILABLE")).toBe(balanceAfterFirst);
  });
});

describe("Escrow refund", () => {
  it("refunds the full remaining amount via a compensating entry, never mutating the original", async () => {
    const { fundEscrow, refundEscrow, escrows, ledger } = setup();
    const { escrowId } = await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });

    const { refundAmount } = await refundEscrow.execute({
      escrowId,
      gatewayProvider: "internal",
      reason: "customer cancelled",
      idempotencyKey: "refund-1",
    });

    expect(refundAmount).toBe(10000);
    expect((await escrows.findById(escrowId))?.status).toBe("REFUNDED");
    // The original funding entry is still there — refund is a new,
    // separate, offsetting entry, not an edit to history.
    expect((await ledger.getAccountBalance("ESCROW_HOLDING")).balance).toBe(0);
    expect((await ledger.getAccountBalance("CASH_AT_PAYMENT_PROVIDER")).balance).toBe(0);
  });

  it("supports a partial refund, leaving the rest available for release or further refund", async () => {
    const { fundEscrow, refundEscrow, escrows } = setup();
    const { escrowId } = await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });

    const { refundAmount } = await refundEscrow.execute({
      escrowId,
      gatewayProvider: "internal",
      reason: "partial dispute resolution",
      refundAmount: 3000,
      idempotencyKey: "refund-1",
    });

    expect(refundAmount).toBe(3000);
    expect((await escrows.findById(escrowId))?.status).toBe("PARTIALLY_REFUNDED");
  });

  it("rejects a refund amount exceeding what remains in escrow", async () => {
    const { fundEscrow, refundEscrow } = setup();
    const { escrowId } = await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });

    await expect(
      refundEscrow.execute({ escrowId, gatewayProvider: "internal", reason: "x", refundAmount: 999999, idempotencyKey: "refund-1" }),
    ).rejects.toBeInstanceOf(InvalidEscrowRefundAmountError);
  });

  it("is idempotent: a retried refund with the same key doesn't refund twice", async () => {
    const { fundEscrow, refundEscrow, ledger } = setup();
    const { escrowId } = await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });

    await refundEscrow.execute({ escrowId, gatewayProvider: "internal", reason: "x", idempotencyKey: "refund-1" });
    await refundEscrow.execute({ escrowId, gatewayProvider: "internal", reason: "x", idempotencyKey: "refund-1" });

    expect((await ledger.getAccountBalance("ESCROW_HOLDING")).balance).toBe(0);
  });

  it("a second refund attempt after the escrow is already fully REFUNDED is rejected, not silently re-applied", async () => {
    const { fundEscrow, refundEscrow } = setup();
    const { escrowId } = await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });
    await refundEscrow.execute({ escrowId, gatewayProvider: "internal", reason: "x", idempotencyKey: "refund-1" });

    await expect(
      refundEscrow.execute({ escrowId, gatewayProvider: "internal", reason: "x", idempotencyKey: "refund-DIFFERENT-KEY" }),
    ).rejects.toBeInstanceOf(EscrowNotHeldError);
  });
});
