import type { EscrowRepository } from "@/domain/finance/escrow-repository";
import type { TransactionRecorder } from "@/domain/finance/transaction-recorder";
import type { PaymentProviderRegistry } from "@/infrastructure/payments/payment-provider-registry";
import type { RefundEscrowUseCase } from "./refund-escrow.use-case";
import { EscrowNotFoundError, InvalidRefundAmountError } from "./errors";

export interface RefundPaymentInput {
  relatedEntityType: string;
  relatedEntityId: string;
  regionId: string;
  refundAmount?: number; // defaults to the full remaining (unreleased) amount
  reason: string;
  idempotencyKey: string;
}

export interface RefundPaymentResult {
  refundAmount: number;
  gatewayRefundRef: string | null;
}

// Customer-facing refund entry point (Phase 6) — the orchestrator that
// decides HOW to give money back, then actually moves it. Two concerns,
// kept separate on purpose:
//   1. Ledger: RefundEscrowUseCase posts the compensating journal entry
//      (Debit ESCROW_HOLDING / Credit CASH_AT_PAYMENT_PROVIDER) — our
//      books, immediately.
//   2. Gateway: this use case then calls PaymentProvider.refund() against
//      the original captured payment's gatewayRef, so the money actually
//      leaves the platform's account and reaches the customer.
// If the funds have already been fully released to a provider (no
// HELD/PARTIALLY_RELEASED escrow left), this round doesn't support
// clawing money back from a provider's wallet — that's a real, harder
// problem (see docs/09-financial-core.md §9 future expansion) explicitly
// out of scope here rather than faked.
export class RefundPaymentUseCase {
  constructor(
    private readonly escrows: EscrowRepository,
    private readonly refundEscrow: RefundEscrowUseCase,
    private readonly transactions: TransactionRecorder,
    private readonly providers: PaymentProviderRegistry,
  ) {}

  async execute(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const escrow = await this.escrows.findByRelatedEntity(input.relatedEntityType, input.relatedEntityId);
    if (!escrow) {
      throw new EscrowNotFoundError();
    }

    const remaining = escrow.amount - escrow.releasedAmount - escrow.refundedAmount;
    if (input.refundAmount != null && (input.refundAmount <= 0 || input.refundAmount > remaining)) {
      throw new InvalidRefundAmountError();
    }

    // Looked up before touching the ledger so the refund's own journal
    // entry/PaymentTransaction records the same gateway that originally
    // funded this escrow, not a placeholder.
    const fundingTransaction = await this.transactions.findLatestByRelatedEntity("ESCROW", escrow.id, "ESCROW_HOLD");

    const { refundAmount } = await this.refundEscrow.execute({
      escrowId: escrow.id,
      gatewayProvider: fundingTransaction?.gatewayProvider ?? "unknown",
      reason: input.reason,
      refundAmount: input.refundAmount,
      idempotencyKey: input.idempotencyKey,
    });

    let gatewayRefundRef: string | null = null;
    if (fundingTransaction?.gatewayRef) {
      const { provider } = await this.providers.resolveForRegion(input.regionId);
      const result = await provider.refund({
        gatewayRef: fundingTransaction.gatewayRef,
        amount: refundAmount,
        reason: input.reason,
        idempotencyKey: `${input.idempotencyKey}:gateway`,
      });
      gatewayRefundRef = result.status === "SUCCEEDED" ? result.refundRef : null;
    }

    return { refundAmount, gatewayRefundRef };
  }
}
