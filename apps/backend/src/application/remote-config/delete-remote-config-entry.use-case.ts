import type { RemoteConfigRepository } from "@/domain/remote-config/remote-config.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import { RemoteConfigEntryNotFoundError } from "./errors";

export class DeleteRemoteConfigEntryUseCase {
  constructor(
    private readonly configs: RemoteConfigRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(entryId: string, actorId: string): Promise<void> {
    const existing = await this.configs.findById(entryId);
    if (!existing) {
      throw new RemoteConfigEntryNotFoundError();
    }

    await this.configs.softDelete(entryId);

    await this.auditLog.write({
      actorId,
      action: "remote_config.delete",
      entityType: "RemoteConfigEntry",
      entityId: entryId,
      metadata: { key: existing.key },
    });
  }
}
