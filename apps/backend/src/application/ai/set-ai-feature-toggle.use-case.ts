import type { AiFeatureToggle } from "@/domain/ai/ai-feature-toggle.entity";
import type { AiFeatureToggleRepository, SetAiFeatureToggleInput } from "@/domain/ai/ai-feature-toggle.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";

export interface SetAiFeatureToggleUseCaseInput extends SetAiFeatureToggleInput {
  actorId: string;
}

// Every AiRegistry.get*() lookup reads AiFeatureToggle rows written here —
// flipping isEnabled/provider here takes effect immediately, no app
// deploy or restart needed (ADR-005/ADR-007: config over code).
export class SetAiFeatureToggleUseCase {
  constructor(
    private readonly toggles: AiFeatureToggleRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: SetAiFeatureToggleUseCaseInput): Promise<AiFeatureToggle> {
    const { actorId, ...rest } = input;
    const toggle = await this.toggles.set(rest);

    await this.auditLog.write({
      actorId,
      action: "ai_feature_toggle.set",
      entityType: "AiFeatureToggle",
      entityId: toggle.id ?? toggle.capability,
      metadata: { capability: toggle.capability, isEnabled: toggle.isEnabled, provider: toggle.provider },
    });

    return toggle;
  }
}
