import type { NotificationBroadcast, NotificationChannel, NotificationBroadcastStatus } from "./notification.entity";

export interface CreateNotificationBroadcastInput {
  channel: NotificationChannel;
  templateKey?: string;
  title: string;
  body: string;
  targetingRules?: Record<string, unknown>;
  scheduledFor?: Date;
  createdById: string;
}

export interface SearchNotificationBroadcastsFilter {
  status?: NotificationBroadcastStatus;
  limit?: number;
}

// Interface only — implemented in infrastructure/notification/prisma-notification-broadcast.repository.ts.
export interface NotificationBroadcastRepository {
  create(input: CreateNotificationBroadcastInput): Promise<NotificationBroadcast>;
  findById(id: string): Promise<NotificationBroadcast | null>;
  search(filter: SearchNotificationBroadcastsFilter): Promise<NotificationBroadcast[]>;
  markSent(id: string, sentAt: Date): Promise<void>;
}
