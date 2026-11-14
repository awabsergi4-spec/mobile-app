import type { NotificationRepository } from "@/domain/notification/notification.repository";

export class MarkNotificationReadUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(notificationId: string, userId: string): Promise<void> {
    await this.notifications.markRead(notificationId, userId);
  }
}

export class MarkAllNotificationsReadUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(userId: string): Promise<number> {
    return this.notifications.markAllRead(userId);
  }
}
