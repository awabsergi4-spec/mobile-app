// Interface only — ADR-001's payment abstraction, specified at design time
// but never implemented until now. Every gateway integration (real or
// mock) implements this; callers never import a concrete gateway SDK
// directly. Resolved per-Region via PaymentGatewayConfig at runtime — see
// infrastructure/payments/payment-provider-registry.ts.
export interface InitiatePaymentInput {
  amount: number; // minor units
  currency: string;
  customerReference: string; // opaque reference to the paying customer (e.g. userId) — never raw PII
  description: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}

export interface InitiatePaymentResult {
  gatewayRef: string;
  status: "PENDING" | "AUTHORIZED" | "FAILED";
  // Set when the gateway requires the customer to complete an
  // out-of-band step (3DS challenge, hosted checkout redirect).
  redirectUrl?: string;
}

export interface CapturePaymentInput {
  gatewayRef: string;
  amount?: number; // omit for a full capture of whatever was authorized
}

export interface CapturePaymentResult {
  status: "SUCCEEDED" | "FAILED";
  capturedAmount: number;
}

export interface RefundPaymentInput {
  gatewayRef: string;
  amount: number;
  reason: string;
  idempotencyKey: string;
}

export interface RefundPaymentResult {
  status: "SUCCEEDED" | "FAILED";
  refundRef: string;
}

export interface WebhookVerificationInput {
  rawBody: string;
  signatureHeader: string | null;
}

// A closed union rather than a free-form payload — every provider adapter
// normalizes its own gateway's event shape into one of these before the
// webhook route ever sees it, so the route/use-case layer never branches
// on a provider-specific event type.
export type PaymentWebhookEvent =
  | { type: "PAYMENT_SUCCEEDED"; gatewayRef: string; amount: number; currency: string }
  | { type: "PAYMENT_FAILED"; gatewayRef: string; reason: string }
  | { type: "PAYMENT_REVERSED"; gatewayRef: string }
  | { type: "REFUND_SUCCEEDED"; gatewayRef: string; refundRef: string; amount: number }
  | { type: "CHARGEBACK"; gatewayRef: string; amount: number };

export interface PaymentProvider {
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  capture(input: CapturePaymentInput): Promise<CapturePaymentResult>;
  refund(input: RefundPaymentInput): Promise<RefundPaymentResult>;
  // Returns null for a signature that doesn't verify — the webhook route
  // treats that as a 400, never as "no event happened."
  verifyWebhook(input: WebhookVerificationInput): PaymentWebhookEvent | null;
}
