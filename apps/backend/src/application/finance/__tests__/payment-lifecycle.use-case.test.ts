import { describe, it, expect } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { InitiatePaymentUseCase } from "../initiate-payment.use-case";
import { CapturePaymentUseCase } from "../capture-payment.use-case";
import { ProcessPaymentWebhookUseCase, InvalidWebhookSignatureError } from "../process-payment-webhook.use-case";
import { RefundPaymentUseCase } from "../refund-payment.use-case";
import { FundEscrowUseCase } from "../fund-escrow.use-case";
import { RefundEscrowUseCase } from "../refund-escrow.use-case";
import { PaymentProviderRegistry } from "@/infrastructure/payments/payment-provider-registry";
import { MockPaymentProvider } from "@/infrastructure/payments/mock-payment-provider";
import { FakeAuditLogWriter, FakeDomainEventPublisher, FakeEscrowRepository, FakeLedgerService, FakeTransactionRecorder } from "./fakes";

// PaymentProviderRegistry.resolveForRegion/resolveByName look up
// PaymentGatewayConfig via Prisma — no region has one configured here, so
// both fall back to the named "mock" MockPaymentProvider, exactly as they
// would for a region nobody has configured a real gateway for yet.
function fakePrisma(): PrismaClient {
  return { paymentGatewayConfig: { findFirst: async () => null } } as unknown as PrismaClient;
}

describe("InitiatePaymentUseCase / CapturePaymentUseCase", () => {
  it("a duplicate initiate call with the same idempotencyKey returns the original transaction instead of authorizing twice", async () => {
    const transactions = new FakeTransactionRecorder();
    const registry = new PaymentProviderRegistry(fakePrisma());
    const initiate = new InitiatePaymentUseCase(registry, transactions);

    const first = await initiate.execute({
      amount: 5000,
      currency: "SDG",
      regionId: "region-1",
      customerUserId: "customer-1",
      description: "test",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      idempotencyKey: "pay-1",
    });
    const second = await initiate.execute({
      amount: 5000,
      currency: "SDG",
      regionId: "region-1",
      customerUserId: "customer-1",
      description: "test",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      idempotencyKey: "pay-1",
    });

    expect(second.transactionId).toBe(first.transactionId);
  });

  it("capture confirms a HELD/PENDING transaction and refuses to capture it twice", async () => {
    const transactions = new FakeTransactionRecorder();
    const registry = new PaymentProviderRegistry(fakePrisma());
    const initiate = new InitiatePaymentUseCase(registry, transactions);
    const capture = new CapturePaymentUseCase(registry, transactions);
    const payment = await initiate.execute({
      amount: 5000,
      currency: "SDG",
      regionId: "region-1",
      customerUserId: "customer-1",
      description: "test",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      idempotencyKey: "pay-1",
    });

    const result = await capture.execute({ transactionId: payment.transactionId, regionId: "region-1", gatewayRef: payment.gatewayRef });
    expect(result.capturedAmount).toBe(5000);
    expect((await transactions.findById(payment.transactionId))?.status).toBe("SUCCEEDED");

    // Already SUCCEEDED — a second capture attempt (retry, double-click)
    // must be rejected, not silently re-captured.
    await expect(capture.execute({ transactionId: payment.transactionId, regionId: "region-1", gatewayRef: payment.gatewayRef })).rejects.toThrow();
  });
});

describe("ProcessPaymentWebhookUseCase", () => {
  it("rejects a webhook whose signature doesn't verify", async () => {
    const transactions = new FakeTransactionRecorder();
    const registry = new PaymentProviderRegistry(fakePrisma());
    const auditLog = new FakeAuditLogWriter();
    const events = new FakeDomainEventPublisher();
    const useCase = new ProcessPaymentWebhookUseCase(registry, transactions, auditLog, events);

    await expect(
      useCase.execute({ providerName: "mock", rawBody: JSON.stringify({ type: "PAYMENT_SUCCEEDED", gatewayRef: "x", amount: 1, currency: "SDG" }), signatureHeader: "bogus" }),
    ).rejects.toBeInstanceOf(InvalidWebhookSignatureError);
  });

  it("a correctly-signed PAYMENT_SUCCEEDED event moves a PENDING/HELD transaction to SUCCEEDED", async () => {
    const transactions = new FakeTransactionRecorder();
    const registry = new PaymentProviderRegistry(fakePrisma());
    const auditLog = new FakeAuditLogWriter();
    const events = new FakeDomainEventPublisher();
    const useCase = new ProcessPaymentWebhookUseCase(registry, transactions, auditLog, events);
    const { transactionId } = await transactions.record({
      type: "DEPOSIT",
      amount: 5000,
      currency: "SDG",
      gatewayProvider: "mock",
      gatewayRef: "gw-ref-1",
      status: "HELD",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
    });
    const provider = new MockPaymentProvider();
    const rawBody = JSON.stringify({ type: "PAYMENT_SUCCEEDED", gatewayRef: "gw-ref-1", amount: 5000, currency: "SDG" });
    const signatureHeader = provider.signWebhookPayload(rawBody);

    await useCase.execute({ providerName: "mock", rawBody, signatureHeader });

    expect((await transactions.findById(transactionId))?.status).toBe("SUCCEEDED");
  });

  it("is safe against webhook replay: redelivering the same event twice is a no-op the second time", async () => {
    const transactions = new FakeTransactionRecorder();
    const registry = new PaymentProviderRegistry(fakePrisma());
    const auditLog = new FakeAuditLogWriter();
    const events = new FakeDomainEventPublisher();
    const useCase = new ProcessPaymentWebhookUseCase(registry, transactions, auditLog, events);
    const { transactionId } = await transactions.record({
      type: "DEPOSIT",
      amount: 5000,
      currency: "SDG",
      gatewayProvider: "mock",
      gatewayRef: "gw-ref-1",
      status: "HELD",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
    });
    const provider = new MockPaymentProvider();
    const rawBody = JSON.stringify({ type: "PAYMENT_SUCCEEDED", gatewayRef: "gw-ref-1", amount: 5000, currency: "SDG" });
    const signatureHeader = provider.signWebhookPayload(rawBody);

    await useCase.execute({ providerName: "mock", rawBody, signatureHeader });
    // Redelivered: the transaction it refers to is no longer HELD/PENDING,
    // so this finds nothing left to do rather than double-processing it.
    await useCase.execute({ providerName: "mock", rawBody, signatureHeader });

    expect((await transactions.findById(transactionId))?.status).toBe("SUCCEEDED");
    expect(events.published.filter((e) => e.type === "PaymentWebhookSucceeded")).toHaveLength(1);
  });

  it("a CHARGEBACK event is recorded for staff review via AuditLog, not auto-resolved", async () => {
    const transactions = new FakeTransactionRecorder();
    const registry = new PaymentProviderRegistry(fakePrisma());
    const auditLog = new FakeAuditLogWriter();
    const events = new FakeDomainEventPublisher();
    const useCase = new ProcessPaymentWebhookUseCase(registry, transactions, auditLog, events);
    const provider = new MockPaymentProvider();
    const rawBody = JSON.stringify({ type: "CHARGEBACK", gatewayRef: "gw-ref-1", amount: 5000 });
    const signatureHeader = provider.signWebhookPayload(rawBody);

    await useCase.execute({ providerName: "mock", rawBody, signatureHeader });

    expect(auditLog.entries).toContainEqual(expect.objectContaining({ action: "payment.chargeback" }));
  });
});

describe("RefundPaymentUseCase", () => {
  it("refunds a still-escrowed payment via a compensating ledger entry and calls the gateway to return the money", async () => {
    const escrows = new FakeEscrowRepository();
    const ledger = new FakeLedgerService();
    ledger.registerAccount("CASH_AT_PAYMENT_PROVIDER", "SDG");
    ledger.registerAccount("ESCROW_HOLDING", "SDG", true);
    const transactions = new FakeTransactionRecorder();
    const events = new FakeDomainEventPublisher();
    const fundEscrow = new FundEscrowUseCase(escrows, ledger, transactions, events);
    const refundEscrow = new RefundEscrowUseCase(escrows, ledger, transactions, events);
    const registry = new PaymentProviderRegistry(fakePrisma());
    const refundPayment = new RefundPaymentUseCase(escrows, refundEscrow, transactions, registry);

    await fundEscrow.execute({
      amount: 10000,
      currency: "SDG",
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      gatewayProvider: "mock",
      gatewayRef: "gw-original-charge",
      idempotencyKey: "fund-1",
    });

    const result = await refundPayment.execute({
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: "milestone-1",
      regionId: "region-1",
      reason: "customer cancelled",
      idempotencyKey: "refund-1",
    });

    expect(result.refundAmount).toBe(10000);
    expect(result.gatewayRefundRef).not.toBeNull();
    expect((await escrows.findByRelatedEntity("CONTRACT_MILESTONE", "milestone-1"))?.status).toBe("REFUNDED");
  });
});
