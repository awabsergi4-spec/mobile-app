import { NextRequest } from "next/server";
import { processPaymentWebhookUseCase } from "@/infrastructure/finance/finance-services";
import { InvalidWebhookSignatureError } from "@/application/finance/process-payment-webhook.use-case";
import { ok, fail } from "@/presentation/http-response";

// No requireAuth — the caller is the payment gateway, not a logged-in
// user. Authentication here IS the signature check
// (PaymentProvider.verifyWebhook), against the raw, unparsed body — never
// trust req.json() for a webhook, since re-serializing a parsed body
// before verifying would invalidate any real gateway's signature.
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params;
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-webhook-signature");

    const result = await processPaymentWebhookUseCase.execute({
      providerName: provider,
      rawBody,
      signatureHeader,
    });

    return ok(result);
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      return fail("INVALID_WEBHOOK_SIGNATURE", err.message, { status: 400 });
    }
    throw err;
  }
}
