import type { NotificationBroadcastRepository } from "@/domain/notification/notification-broadcast.repository";
import type { NotificationRepository } from "@/domain/notification/notification.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { TargetingRules } from "@sahl/shared/schemas/targeting.schema";
import { NotificationBroadcastAlreadySentError, NotificationBroadcastNotFoundError } from "./errors";

export interface TargetResolver {
  resolveUserIds(rules: TargetingRules | null | undefined): Promise<string[]>;
}

export interface SendNotificationBroadcastInput {
  broadcastId: string;
  actorId: string;
}

export interface SendNotificationBroadcastResult {
  recipientCount: number;
}

// Fans a DRAFT broadcast out into one Notification row per matched user
// (real, non-Firebase, persistent in-app delivery — see
// docs/00-admin-panel-spec.md notifications module). PUSH-channel
// broadcasts still get in-app rows; there is no push transport wired up
// yet since the platform launches without Firebase.
export class SendNotificationBroadcastUseCase {
  constructor(
    private readonly broadcasts: NotificationBroadcastRepository,
    private readonly notifications: NotificationRepository,
    private readonly targetResolver: TargetResolver,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: SendNotificationBroadcastInput): Promise<SendNotificationBroadcastResult> {
    const broadcast = await this.broadcasts.findById(input.broadcastId);
    if (!broadcast) {
      throw new NotificationBroadcastNotFoundError();
    }
    if (broadcast.sentAt) {
      throw new NotificationBroadcastAlreadySentError();
    }

    const userIds = await this.targetResolver.resolveUserIds(broadcast.targetingRules as TargetingRules | null);

    const recipientCount = await this.notifications.createMany(
      userIds.map((userId) => ({
        userId,
        type: "broadcast",
        title: broadcast.title,
        body: broadcast.body,
        data: { broadcastId: broadcast.id, channel: broadcast.channel },
      })),
    );

    await this.broadcasts.markSent(broadcast.id, new Date());

    await this.auditLog.write({
      actorId: input.actorId,
      action: "notification_broadcast.send",
      entityType: "NotificationBroadcast",
      entityId: broadcast.id,
      metadata: { recipientCount },
    });

    return { recipientCount };
  }
}
