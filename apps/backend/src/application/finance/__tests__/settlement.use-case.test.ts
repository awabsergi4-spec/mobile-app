import { describe, it, expect } from "vitest";
import { RequestWithdrawalUseCase } from "../request-withdrawal.use-case";
import { ApproveWithdrawalUseCase } from "../approve-withdrawal.use-case";
import { CreateSettlementUseCase } from "../create-settlement.use-case";
import { CompleteSettlementUseCase } from "../complete-settlement.use-case";
import { InvalidSettlementStatusTransitionError } from "../errors";
import { FakeAuditLogWriter, FakeDomainEventPublisher, FakeSettlementRepository, FakeWalletRepository, FakeWithdrawalRepository } from "./fakes";

function setup() {
  const wallets = new FakeWalletRepository();
  const withdrawals = new FakeWithdrawalRepository();
  const settlements = new FakeSettlementRepository();
  const auditLog = new FakeAuditLogWriter();
  const events = new FakeDomainEventPublisher();
  const requestWithdrawal = new RequestWithdrawalUseCase(wallets, withdrawals, events);
  const approveWithdrawal = new ApproveWithdrawalUseCase(withdrawals, auditLog, events);
  const createSettlement = new CreateSettlementUseCase(settlements, withdrawals, events);
  const completeSettlement = new CompleteSettlementUseCase(settlements, events);
  return { wallets, withdrawals, settlements, requestWithdrawal, approveWithdrawal, createSettlement, completeSettlement };
}

describe("Settlement batching over Withdrawal", () => {
  it("batches every APPROVED withdrawal in one currency into a single Settlement, moving them to PROCESSING", async () => {
    const { wallets, withdrawals, requestWithdrawal, approveWithdrawal, createSettlement } = setup();
    const walletA = wallets.seed("provider-1");
    const walletB = wallets.seed("provider-2");
    await wallets.adjustBalance(walletA.id, "AVAILABLE", 5000);
    await wallets.adjustBalance(walletB.id, "AVAILABLE", 3000);
    const wA = await requestWithdrawal.execute({ providerId: "provider-1", walletId: walletA.id, amount: 5000, currency: "SDG", method: "BANK_TRANSFER" });
    const wB = await requestWithdrawal.execute({ providerId: "provider-2", walletId: walletB.id, amount: 3000, currency: "SDG", method: "BANK_TRANSFER" });
    await approveWithdrawal.execute({ withdrawalId: wA.id, approvedById: "admin-1" });
    await approveWithdrawal.execute({ withdrawalId: wB.id, approvedById: "admin-1" });

    const settlement = await createSettlement.execute({ schedule: "MANUAL", currency: "SDG" });

    expect(settlement).toMatchObject({ totalAmount: 8000, currency: "SDG", status: "PENDING" });
    expect((await withdrawals.findById(wA.id))?.status).toBe("PROCESSING");
    expect((await withdrawals.findById(wB.id))?.status).toBe("PROCESSING");
    expect((await withdrawals.findById(wA.id))?.settlementId).toBe(settlement!.id);
  });

  it("returns null when there is nothing APPROVED to batch, rather than creating an empty settlement", async () => {
    const { createSettlement } = setup();
    const settlement = await createSettlement.execute({ schedule: "MANUAL", currency: "SDG" });
    expect(settlement).toBeNull();
  });

  it("ignores withdrawals in a different currency", async () => {
    const { wallets, requestWithdrawal, approveWithdrawal, createSettlement } = setup();
    const wallet = wallets.seed("provider-1", "USD");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 1000);
    const w = await requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 1000, currency: "USD", method: "BANK_TRANSFER" });
    await approveWithdrawal.execute({ withdrawalId: w.id, approvedById: "admin-1" });

    const settlement = await createSettlement.execute({ schedule: "MANUAL", currency: "SDG" });
    expect(settlement).toBeNull();
  });

  it("completes a settlement batch once its withdrawals have been individually paid/failed", async () => {
    const { wallets, requestWithdrawal, approveWithdrawal, createSettlement, completeSettlement, settlements } = setup();
    const wallet = wallets.seed("provider-1");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 5000);
    const w = await requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 5000, currency: "SDG", method: "BANK_TRANSFER" });
    await approveWithdrawal.execute({ withdrawalId: w.id, approvedById: "admin-1" });
    const settlement = await createSettlement.execute({ schedule: "MANUAL", currency: "SDG" });

    await completeSettlement.execute({ settlementId: settlement!.id });

    expect((await settlements.findById(settlement!.id))?.status).toBe("COMPLETED");
  });

  it("rejects completing an already-COMPLETED settlement a second time", async () => {
    const { wallets, requestWithdrawal, approveWithdrawal, createSettlement, completeSettlement } = setup();
    const wallet = wallets.seed("provider-1");
    await wallets.adjustBalance(wallet.id, "AVAILABLE", 5000);
    const w = await requestWithdrawal.execute({ providerId: "provider-1", walletId: wallet.id, amount: 5000, currency: "SDG", method: "BANK_TRANSFER" });
    await approveWithdrawal.execute({ withdrawalId: w.id, approvedById: "admin-1" });
    const settlement = await createSettlement.execute({ schedule: "MANUAL", currency: "SDG" });
    await completeSettlement.execute({ settlementId: settlement!.id });

    await expect(completeSettlement.execute({ settlementId: settlement!.id })).rejects.toBeInstanceOf(InvalidSettlementStatusTransitionError);
  });
});
