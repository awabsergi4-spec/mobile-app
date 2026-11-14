import type { TransactionRecorder } from "@/domain/finance/transaction-recorder";
import type { PaymentProviderRegistry } from "@/infrastructure/payments/payment-provider-registry";

export interface InitiatePaymentInput {
  amount: number; // minor units
  currency: string;
  regionId: string;
  customerUserId: string;
  description: string;
  relatedEntityType: string;
  relatedEntityId: string;
  idempotencyKey: string;
}

export interface InitiatePaymentResult {
  transactionId: string;
  gatewayRef: string;
  status: "PENDING" | "HELD" | "FAILED";
  redirectUrl?: string;
}

// Authorizes a payment with the gateway and records the attempt — no
// ledger entry yet, since no money has moved in our books: authorization
// only reserves funds at the gateway. The ledger entry is posted by
// whichever downstream use case decides where a captured payment's money
// goes (FundEscrowUseCase, DepositToWalletUseCase) — CapturePaymentUseCase
// confirms the gateway-side capture, those decide the accounting.
export class InitiatePaymentUseCase {
  constructor(
    private readonly providers: PaymentProviderRegistry,
    private readonly transactions: TransactionRecorder,
  ) {}

  async execute(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const existing = await this.transactions.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      return {
        transactionId: existing.id,
        gatewayRef: "",
        status: existing.status === "SUCCEEDED" ? "HELD" : (existing.status as "PENDING" | "HELD" | "FAILED"),
      };
    }

    const { provider, providerName } = await this.providers.resolveForRegion(input.regionId);

    const result = await provider.initiate({
      amount: input.amount,
      currency: input.currency,
      customerReference: input.customerUserId,
      description: input.description,
      idempotencyKey: input.idempotencyKey,
    });

    const status = result.status === "AUTHORIZED" ? "HELD" : result.status;

    const { transactionId } = await this.transactions.record({
      type: "DEPOSIT",
      amount: input.amount,
      currency: input.currency,
      gatewayProvider: providerName,
      gatewayRef: result.gatewayRef,
      status,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      idempotencyKey: input.idempotencyKey,
    });

    return { transactionId, gatewayRef: result.gatewayRef, status, redirectUrl: result.redirectUrl };
  }
}
