import type { TransactionRecorder } from "@/domain/finance/transaction-recorder";
import type { PaymentProviderRegistry } from "@/infrastructure/payments/payment-provider-registry";
import { PaymentCaptureFailedError, PaymentNotCapturableError, PaymentTransactionNotFoundError } from "./errors";

export interface CapturePaymentInput {
  transactionId: string;
  regionId: string;
  gatewayRef: string;
  amount?: number; // partial capture; omit for full
}

export interface CapturePaymentResult {
  transactionId: string;
  capturedAmount: number;
}

// Confirms the gateway actually took the money that InitiatePaymentUseCase
// authorized. Still posts no ledger entry — see InitiatePaymentUseCase's
// header comment for why: the accounting only happens once a downstream
// use case decides the captured funds' destination (escrow vs wallet).
export class CapturePaymentUseCase {
  constructor(
    private readonly providers: PaymentProviderRegistry,
    private readonly transactions: TransactionRecorder,
  ) {}

  async execute(input: CapturePaymentInput): Promise<CapturePaymentResult> {
    const transaction = await this.transactions.findById(input.transactionId);
    if (!transaction) {
      throw new PaymentTransactionNotFoundError();
    }
    if (transaction.status !== "HELD" && transaction.status !== "PENDING") {
      throw new PaymentNotCapturableError();
    }

    // The originally authorized amount lives in our own PaymentTransaction
    // row (recorded by InitiatePaymentUseCase), not just in gateway/adapter
    // memory — PaymentProviderRegistry hands back a fresh provider instance
    // per call, so nothing about a prior initiate() is guaranteed to still
    // be resident in whatever object resolveForRegion returns this time.
    // A full capture (input.amount omitted) must still tell the gateway
    // the correct amount to capture.
    const { provider } = await this.providers.resolveForRegion(input.regionId);
    const result = await provider.capture({ gatewayRef: input.gatewayRef, amount: input.amount ?? transaction.amount });

    if (result.status !== "SUCCEEDED") {
      await this.transactions.updateStatus(input.transactionId, "FAILED");
      throw new PaymentCaptureFailedError();
    }

    await this.transactions.updateStatus(input.transactionId, "SUCCEEDED");

    return { transactionId: input.transactionId, capturedAmount: result.capturedAmount };
  }
}
