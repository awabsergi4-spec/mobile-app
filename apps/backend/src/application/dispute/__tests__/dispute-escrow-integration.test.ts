import { describe, it, expect } from "vitest";
import { OpenDisputeUseCase } from "../open-dispute.use-case";
import { ResolveDisputeUseCase } from "../resolve-dispute.use-case";
import { DisputeNotOpenError, InvalidDisputeSplitError } from "../errors";
import { FakeDisputeRepository } from "./fakes";
import { FundEscrowUseCase } from "@/application/finance/fund-escrow.use-case";
import { ReleaseEscrowUseCase } from "@/application/finance/release-escrow.use-case";
import { RefundEscrowUseCase } from "@/application/finance/refund-escrow.use-case";
import {
  FakeAuditLogWriter,
  FakeDomainEventPublisher,
  FakeEscrowRepository,
  FakeLedgerService,
  FakeTransactionRecorder,
  FakeWalletRepository,
} from "@/application/finance/__tests__/fakes";

function setup() {
  const disputes = new FakeDisputeRepository();
  const escrows = new FakeEscrowRepository();
  const ledger = new FakeLedgerService();
  ledger.registerAccount("CASH_AT_PAYMENT_PROVIDER", "SDG");
  ledger.registerAccount("ESCROW_HOLDING", "SDG", true);
  ledger.registerAccount("PROVIDER_WALLETS_PAYABLE", "SDG", true);
  ledger.registerAccount("COMMISSION_REVENUE", "SDG", true);
  const wallets = new FakeWalletRepository();
  const transactions = new FakeTransactionRecorder();
  const auditLog = new FakeAuditLogWriter();
  const events = new FakeDomainEventPublisher();
  const fundEscrow = new FundEscrowUseCase(escrows, ledger, transactions, events);
  const releaseEscrow = new ReleaseEscrowUseCase(escrows, ledger, wallets, transactions, events);
  const refundEscrow = new RefundEscrowUseCase(escrows, ledger, transactions, events);
  const openDispute = new OpenDisputeUseCase(disputes, escrows, events);
  const resolveDispute = new ResolveDisputeUseCase(disputes, escrows, releaseEscrow, refundEscrow, auditLog, events);
  return { disputes, escrows, wallets, ledger, auditLog, fundEscrow, releaseEscrow, refundEscrow, openDispute, resolveDispute };
}

describe("Dispute <-> Escrow integration", () => {
  it("opening a dispute locks a HELD escrow to DISPUTED", async () => {
    const { fundEscrow, escrows, openDispute } = setup();
    await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });

    await openDispute.execute({ raisedById: "customer-1", relatedEntityType: "CONTRACT_MILESTONE", relatedEntityId: "milestone-1", reason: "work not delivered" });

    const escrow = await escrows.findByRelatedEntity("CONTRACT_MILESTONE", "milestone-1");
    expect(escrow?.status).toBe("DISPUTED");
  });

  it("a DISPUTED escrow can no longer be released through the normal (non-dispute) flow", async () => {
    const { fundEscrow, openDispute, releaseEscrow, wallets, escrows } = setup();
    await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });
    await openDispute.execute({ raisedById: "customer-1", relatedEntityType: "CONTRACT_MILESTONE", relatedEntityId: "milestone-1", reason: "work not delivered" });
    const escrow = await escrows.findByRelatedEntity("CONTRACT_MILESTONE", "milestone-1");
    const wallet = wallets.seed("provider-1");

    await expect(
      releaseEscrow.execute({
        escrowId: escrow!.id,
        providerWalletId: wallet.id,
        commissionPercentage: 10,
        gatewayProvider: "internal",
      }),
    ).rejects.toThrow();
  });

  it("resolving with RELEASE_TO_PROVIDER unlocks the escrow and pays the provider", async () => {
    const { fundEscrow, openDispute, resolveDispute, escrows, wallets, disputes } = setup();
    await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });
    const dispute = await openDispute.execute({ raisedById: "customer-1", relatedEntityType: "CONTRACT_MILESTONE", relatedEntityId: "milestone-1", reason: "quality" });
    const wallet = wallets.seed("provider-1");

    await resolveDispute.execute({
      disputeId: dispute.id,
      resolvedById: "admin-1",
      resolutionNotes: "provider delivered as agreed",
      resolution: { decision: "RELEASE_TO_PROVIDER", providerWalletId: wallet.id, commissionPercentage: 10, gatewayProvider: "internal" },
    });

    const escrow = await escrows.findByRelatedEntity("CONTRACT_MILESTONE", "milestone-1");
    expect(escrow?.status).toBe("RELEASED");
    expect(await wallets.getBalance(wallet.id, "AVAILABLE")).toBe(9000);
    expect((await disputes.findById(dispute.id))?.status).toBe("RESOLVED");
  });

  it("resolving with REFUND_CUSTOMER unlocks the escrow and refunds it", async () => {
    const { fundEscrow, openDispute, resolveDispute, escrows } = setup();
    await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });
    const dispute = await openDispute.execute({ raisedById: "customer-1", relatedEntityType: "CONTRACT_MILESTONE", relatedEntityId: "milestone-1", reason: "not delivered" });

    await resolveDispute.execute({
      disputeId: dispute.id,
      resolvedById: "admin-1",
      resolutionNotes: "provider never delivered",
      resolution: { decision: "REFUND_CUSTOMER", gatewayProvider: "internal" },
    });

    const escrow = await escrows.findByRelatedEntity("CONTRACT_MILESTONE", "milestone-1");
    expect(escrow?.status).toBe("REFUNDED");
  });

  it("resolving with PARTIAL_SPLIT releases part to the provider and refunds the rest", async () => {
    const { fundEscrow, openDispute, resolveDispute, escrows, wallets } = setup();
    await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });
    const dispute = await openDispute.execute({ raisedById: "customer-1", relatedEntityType: "CONTRACT_MILESTONE", relatedEntityId: "milestone-1", reason: "partial delivery" });
    const wallet = wallets.seed("provider-1");

    await resolveDispute.execute({
      disputeId: dispute.id,
      resolvedById: "admin-1",
      resolutionNotes: "half the work was completed",
      resolution: {
        decision: "PARTIAL_SPLIT",
        providerAmount: 6000,
        refundAmount: 4000,
        providerWalletId: wallet.id,
        commissionPercentage: 10,
        gatewayProvider: "internal",
      },
    });

    const escrow = await escrows.findByRelatedEntity("CONTRACT_MILESTONE", "milestone-1");
    expect(escrow?.releasedAmount).toBe(6000);
    expect(escrow?.refundedAmount).toBe(4000);
    expect(await wallets.getBalance(wallet.id, "AVAILABLE")).toBe(5400);
  });

  it("rejects a PARTIAL_SPLIT whose amounts exceed what's actually held", async () => {
    const { fundEscrow, openDispute, resolveDispute, wallets } = setup();
    await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });
    const dispute = await openDispute.execute({ raisedById: "customer-1", relatedEntityType: "CONTRACT_MILESTONE", relatedEntityId: "milestone-1", reason: "x" });
    const wallet = wallets.seed("provider-1");

    await expect(
      resolveDispute.execute({
        disputeId: dispute.id,
        resolvedById: "admin-1",
        resolutionNotes: "x",
        resolution: {
          decision: "PARTIAL_SPLIT",
          providerAmount: 7000,
          refundAmount: 7000,
          providerWalletId: wallet.id,
          commissionPercentage: 10,
          gatewayProvider: "internal",
        },
      }),
    ).rejects.toBeInstanceOf(InvalidDisputeSplitError);
  });

  it("rejects resolving a dispute that's already RESOLVED", async () => {
    const { fundEscrow, openDispute, resolveDispute, wallets } = setup();
    await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "internal",
      idempotencyKey: "fund-1",
    });
    const dispute = await openDispute.execute({ raisedById: "customer-1", relatedEntityType: "CONTRACT_MILESTONE", relatedEntityId: "milestone-1", reason: "x" });
    const wallet = wallets.seed("provider-1");
    await resolveDispute.execute({
      disputeId: dispute.id,
      resolvedById: "admin-1",
      resolutionNotes: "resolved once",
      resolution: { decision: "RELEASE_TO_PROVIDER", providerWalletId: wallet.id, commissionPercentage: 10, gatewayProvider: "internal" },
    });

    await expect(
      resolveDispute.execute({
        disputeId: dispute.id,
        resolvedById: "admin-1",
        resolutionNotes: "trying again",
        resolution: { decision: "REFUND_CUSTOMER", gatewayProvider: "internal" },
      }),
    ).rejects.toBeInstanceOf(DisputeNotOpenError);
  });
});
