import { randomUUID, createHmac, timingSafeEqual } from "crypto";
import type {
  CapturePaymentInput,
  CapturePaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  PaymentWebhookEvent,
  RefundPaymentInput,
  RefundPaymentResult,
  WebhookVerificationInput,
} from "@/domain/payments/payment-provider";

// Development/test PaymentProvider — always succeeds, signs webhooks with
// a real HMAC (so signature verification is exercised end-to-end, not
// stubbed out) rather than a fixed literal secret. Keeps the platform
// usable end-to-end (docs/09-financial-core.md §10: "real payment gateway
// adapter isn't built in this round") without a real gateway account.
// A real adapter (Stripe/etc.) implements the identical interface and is
// resolved instead via PaymentProviderRegistry — no caller changes.
export class MockPaymentProvider implements PaymentProvider {
  // Tracks each authorization's amount so a full capture (input.amount
  // omitted, per CapturePaymentInput's "omit for a full capture of
  // whatever was authorized") reports the actual authorized amount rather
  // than silently reporting 0 — a real gateway remembers what it
  // authorized; this mock needs to as well for CapturePaymentUseCase's
  // result to be trustworthy.
  private readonly authorizedAmounts = new Map<string, number>();

  constructor(private readonly webhookSecret: string = "mock-dev-secret") {}

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const gatewayRef = `mock_pi_${randomUUID()}`;
    this.authorizedAmounts.set(gatewayRef, input.amount);
    return { gatewayRef, status: "AUTHORIZED" };
  }

  async capture(input: CapturePaymentInput): Promise<CapturePaymentResult> {
    const capturedAmount = input.amount ?? this.authorizedAmounts.get(input.gatewayRef) ?? 0;
    return { status: "SUCCEEDED", capturedAmount };
  }

  async refund(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    return { status: "SUCCEEDED", refundRef: `mock_re_${randomUUID()}` };
  }

  // Real HMAC-SHA256 verification against a shared secret — the same
  // mechanism a real gateway adapter uses, just with a dev-only secret
  // instead of one issued by an actual payment processor.
  verifyWebhook(input: WebhookVerificationInput): PaymentWebhookEvent | null {
    if (!input.signatureHeader) return null;

    const expected = createHmac("sha256", this.webhookSecret).update(input.rawBody).digest("hex");
    const provided = Buffer.from(input.signatureHeader);
    const expectedBuffer = Buffer.from(expected);
    if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) {
      return null;
    }

    try {
      const parsed = JSON.parse(input.rawBody);
      if (!parsed || typeof parsed.type !== "string" || typeof parsed.gatewayRef !== "string") {
        return null;
      }
      return parsed as PaymentWebhookEvent;
    } catch {
      return null;
    }
  }

  // Test-only helper: sign a payload the way this provider's real
  // webhook sender would, so tests/dev tooling can construct a valid
  // signed request without duplicating the HMAC logic above.
  signWebhookPayload(rawBody: string): string {
    return createHmac("sha256", this.webhookSecret).update(rawBody).digest("hex");
  }
}
