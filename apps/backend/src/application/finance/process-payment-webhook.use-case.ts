import type { TransactionRecorder } from "@/domain/finance/transaction-recorder";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import type { PaymentProviderRegistry } from "@/infrastructure/payments/payment-provider-registry";

export interface ProcessPaymentWebhookInput {
  providerName: string;
  rawBody: string;
  signatureHeader: string | null;
}

export class InvalidWebhookSignatureError extends Error {
  constructor() {
    super("Webhook signature verification failed");
  }
}

// Financial Core Phase 13. Idempotent by construction, not by a separate
// dedupe table: every branch only acts if the PaymentTransaction it finds
// is still in the state the event would move it out of — a redelivered
// webhook for an already-SUCCEEDED transaction finds nothing left to do
// and returns cleanly, the same "conditional on current state" discipline
// used everywhere else in this module rather than a new mechanism.
export class ProcessPaymentWebhookUseCase {
  constructor(
    private readonly providers: PaymentProviderRegistry,
    private readonly transactions: TransactionRecorder,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: ProcessPaymentWebhookInput): Promise<{ handled: boolean }> {
    const provider = await this.providers.resolveByName(input.providerName);
    const event = provider.verifyWebhook({ rawBody: input.rawBody, signatureHeader: input.signatureHeader });
    if (!event) {
      throw new InvalidWebhookSignatureError();
    }

    switch (event.type) {
      case "PAYMENT_SUCCEEDED": {
        const tx = await this.transactions.findLatestByGatewayRef(event.gatewayRef);
        if (tx && (tx.status === "PENDING" || tx.status === "HELD")) {
          await this.transactions.updateStatus(tx.id, "SUCCEEDED");
          await this.events.publish({
            type: "PaymentWebhookSucceeded",
            payload: { gatewayRef: event.gatewayRef, amount: event.amount, currency: event.currency },
            relatedEntityType: tx.relatedEntityType,
            relatedEntityId: tx.relatedEntityId,
          });
        }
        break;
      }
      case "PAYMENT_FAILED": {
        const tx = await this.transactions.findLatestByGatewayRef(event.gatewayRef);
        if (tx && (tx.status === "PENDING" || tx.status === "HELD")) {
          await this.transactions.updateStatus(tx.id, "FAILED");
        }
        break;
      }
      case "PAYMENT_REVERSED": {
        const tx = await this.transactions.findLatestByGatewayRef(event.gatewayRef);
        if (tx && tx.status === "SUCCEEDED") {
          await this.transactions.updateStatus(tx.id, "REVERSED");
        }
        break;
      }
      case "REFUND_SUCCEEDED": {
        // Confirmatory only — RefundPaymentUseCase already records the
        // refund synchronously when a customer/admin initiates it; a
        // gateway's own refund-confirmation webhook has nothing further
        // for this system to do beyond acknowledging receipt.
        break;
      }
      case "CHARGEBACK": {
        // A real fund clawback from an already-released provider payout
        // is the same "harder problem, explicitly out of scope" flagged
        // in RefundPaymentUseCase — a chargeback is recorded for staff
        // review, not auto-resolved.
        const tx = await this.transactions.findLatestByGatewayRef(event.gatewayRef);
        await this.auditLog.write({
          actorId: null,
          action: "payment.chargeback",
          entityType: "PaymentTransaction",
          entityId: tx?.id ?? event.gatewayRef,
          metadata: { gatewayRef: event.gatewayRef, amount: event.amount },
        });
        await this.events.publish({
          type: "PaymentChargeback",
          payload: { gatewayRef: event.gatewayRef, amount: event.amount },
          relatedEntityType: tx?.relatedEntityType ?? "ESCROW",
          relatedEntityId: tx?.relatedEntityId ?? event.gatewayRef,
        });
        break;
      }
    }

    return { handled: true };
  }
}
