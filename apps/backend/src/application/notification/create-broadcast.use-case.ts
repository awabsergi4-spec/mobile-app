import type { NotificationBroadcast } from "@/domain/notification/notification.entity";
import type { CreateNotificationBroadcastInput, NotificationBroadcastRepository } from "@/domain/notification/notification-broadcast.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";

export interface CreateBroadcastUseCaseInput extends CreateNotificationBroadcastInput {
  actorId: string;
}

// Broadcasts are created as DRAFT — sending is always a deliberate second
// step (SendNotificationBroadcastUseCase), never implicit at creation time.
export class CreateNotificationBroadcastUseCase {
  constructor(
    private readonly broadcasts: NotificationBroadcastRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: CreateBroadcastUseCaseInput): Promise<NotificationBroadcast> {
    const { actorId, ...rest } = input;
    const broadcast = await this.broadcasts.create(rest);

    await this.auditLog.write({
      actorId,
      action: "notification_broadcast.create",
      entityType: "NotificationBroadcast",
      entityId: broadcast.id,
      metadata: { channel: broadcast.channel },
    });

    return broadcast;
  }
}
