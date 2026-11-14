import type { Notification } from "./notification.entity";

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface ListNotificationsFilter {
  unreadOnly?: boolean;
  limit?: number;
  cursor?: string;
}

// Interface only — implemented in infrastructure/notification/prisma-notification.repository.ts.
// Per-user inbox rows. Fan-out from a NotificationBroadcast writes many of
// these via createMany; nothing here concerns itself with delivery
// transport (push/SMS) — this is the persistent in-app record, which works
// with no Firebase or other push provider configured.
export interface NotificationRepository {
  createMany(inputs: CreateNotificationInput[]): Promise<number>;
  listForUser(userId: string, filter: ListNotificationsFilter): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markRead(id: string, userId: string): Promise<void>;
  markAllRead(userId: string): Promise<number>;
}
