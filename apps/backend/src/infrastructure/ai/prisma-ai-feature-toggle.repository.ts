import type { PrismaClient } from "@prisma/client";
import { AI_CAPABILITIES } from "@/domain/ai/ai-feature-toggle.entity";
import type { AiCapability, AiFeatureToggle } from "@/domain/ai/ai-feature-toggle.entity";
import type { AiFeatureToggleRepository, SetAiFeatureToggleInput } from "@/domain/ai/ai-feature-toggle.repository";

export class PrismaAiFeatureToggleRepository implements AiFeatureToggleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listAll(): Promise<AiFeatureToggle[]> {
    const rows = (await this.prisma.aiFeatureToggle.findMany()) as unknown as AiFeatureToggle[];
    const byCapability = new Map(rows.map((row) => [row.capability, row]));

    return AI_CAPABILITIES.map(
      (capability) =>
        byCapability.get(capability) ?? {
          id: null,
          capability,
          isEnabled: false,
          provider: "rule-based",
          config: null,
          updatedAt: null,
        },
    );
  }

  async findByCapability(capability: AiCapability): Promise<AiFeatureToggle | null> {
    return this.prisma.aiFeatureToggle.findUnique({ where: { capability } }) as unknown as Promise<AiFeatureToggle | null>;
  }

  async set(input: SetAiFeatureToggleInput): Promise<AiFeatureToggle> {
    return this.prisma.aiFeatureToggle.upsert({
      where: { capability: input.capability },
      create: {
        capability: input.capability,
        isEnabled: input.isEnabled,
        provider: input.provider,
        config: input.config as never,
      },
      update: {
        isEnabled: input.isEnabled,
        provider: input.provider,
        config: input.config as never,
      },
    }) as unknown as Promise<AiFeatureToggle>;
  }
}
