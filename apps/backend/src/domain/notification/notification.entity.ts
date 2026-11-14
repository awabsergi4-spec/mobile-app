export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: Date | null;
  createdAt: Date;
}

export type NotificationChannel = "PUSH" | "IN_APP" | "POPUP" | "FULL_SCREEN_ALERT" | "EMERGENCY_BROADCAST";
export type NotificationBroadcastStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export interface NotificationBroadcast {
  id: string;
  channel: NotificationChannel;
  templateKey: string | null;
  title: string;
  body: string;
  targetingRules: Record<string, unknown> | null;
  scheduledFor: Date | null;
  sentAt: Date | null;
  status: NotificationBroadcastStatus;
  createdById: string;
  createdAt: Date;
}
