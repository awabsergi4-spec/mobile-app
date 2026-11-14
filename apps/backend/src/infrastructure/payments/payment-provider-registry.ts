import type { PrismaClient } from "@prisma/client";
import type { PaymentProvider } from "@/domain/payments/payment-provider";
import { MockPaymentProvider } from "./mock-payment-provider";

// Resolves the active PaymentProvider for a Region from PaymentGatewayConfig
// — same "registry keyed by config, not a hardcoded switch in business
// logic" shape as AiProviderRegistry (ADR-006) and ActionExecutorRegistry
// (ADR-009). Adding a real gateway (Stripe, a mobile-money processor) is a
// new `case` here plus a new adapter class — no caller of PaymentProvider
// changes.
export class PaymentProviderRegistry {
  constructor(private readonly prisma: PrismaClient) {}

  async resolveForRegion(regionId: string): Promise<{ provider: PaymentProvider; providerName: string }> {
    const config = await this.prisma.paymentGatewayConfig.findFirst({
      where: { regionId, isActive: true },
    });

    if (!config) {
      // No gateway configured for this region yet — the mock provider
      // keeps the platform usable in dev/staging rather than throwing,
      // while still being an explicit, named fallback (never silent).
      return { provider: new MockPaymentProvider(), providerName: "mock" };
    }

    return { provider: this.build(config.provider, config.config), providerName: config.provider };
  }

  // Used by the payment webhook route, which is addressed by provider
  // name (the gateway calls back to a URL naming itself), not by region —
  // any active config row for that provider carries the shared webhook
  // secret needed to verify the signature.
  async resolveByName(providerName: string): Promise<PaymentProvider> {
    if (providerName === "mock") {
      const config = await this.prisma.paymentGatewayConfig.findFirst({ where: { provider: "mock", isActive: true } });
      return this.build("mock", config?.config ?? null);
    }

    const config = await this.prisma.paymentGatewayConfig.findFirst({ where: { provider: providerName, isActive: true } });
    if (!config) {
      throw new Error(`No active PaymentGatewayConfig for provider "${providerName}"`);
    }
    return this.build(config.provider, config.config);
  }

  private build(provider: string, config: unknown): PaymentProvider {
    switch (provider) {
      case "mock":
        return new MockPaymentProvider((config as { webhookSecret?: string } | null)?.webhookSecret);
      // "stripe" | "mobile-money" | other real gateways register here as
      // their adapters are built — additive, never a change to this
      // registry's callers.
      default:
        throw new Error(`Payment provider "${provider}" has no adapter registered`);
    }
  }
}
