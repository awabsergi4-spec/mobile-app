import type { RemoteConfigEntry } from "@/domain/remote-config/remote-config.entity";
import type { RemoteConfigRepository, UpdateRemoteConfigEntryInput } from "@/domain/remote-config/remote-config.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import { assertValueMatchesType } from "./validate-value";
import { RemoteConfigEntryNotFoundError } from "./errors";

export interface UpdateRemoteConfigEntryUseCaseInput extends UpdateRemoteConfigEntryInput {
  entryId: string;
  actorId: string;
}

export class UpdateRemoteConfigEntryUseCase {
  constructor(
    private readonly configs: RemoteConfigRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: UpdateRemoteConfigEntryUseCaseInput): Promise<RemoteConfigEntry> {
    const { entryId, actorId, ...rest } = input;
    const existing = await this.configs.findById(entryId);
    if (!existing) {
      throw new RemoteConfigEntryNotFoundError();
    }

    if (rest.value !== undefined) {
      assertValueMatchesType(rest.valueType ?? existing.valueType, rest.value);
    }

    const updated = await this.configs.update(entryId, rest);

    await this.auditLog.write({
      actorId,
      action: "remote_config.update",
      entityType: "RemoteConfigEntry",
      entityId: entryId,
      metadata: { key: existing.key },
    });

    return updated;
  }
}
