import type { RemoteConfigEntry } from "@/domain/remote-config/remote-config.entity";
import type { CreateRemoteConfigEntryInput, RemoteConfigRepository } from "@/domain/remote-config/remote-config.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import { assertValueMatchesType } from "./validate-value";

export interface CreateRemoteConfigEntryUseCaseInput extends CreateRemoteConfigEntryInput {
  actorId: string;
}

export class CreateRemoteConfigEntryUseCase {
  constructor(
    private readonly configs: RemoteConfigRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: CreateRemoteConfigEntryUseCaseInput): Promise<RemoteConfigEntry> {
    assertValueMatchesType(input.valueType, input.value);

    const { actorId, ...rest } = input;
    const entry = await this.configs.create(rest);

    await this.auditLog.write({
      actorId,
      action: "remote_config.create",
      entityType: "RemoteConfigEntry",
      entityId: entry.id,
      metadata: { key: entry.key, regionId: entry.regionId },
    });

    return entry;
  }
}
