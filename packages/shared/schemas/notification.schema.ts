import { z } from "zod";
import { targetingRulesSchema } from "./targeting.schema";

// Matches NotificationChannel in apps/backend/prisma/schema.prisma.
export const notificationChannelSchema = z.enum(["PUSH", "IN_APP", "POPUP", "FULL_SCREEN_ALERT", "EMERGENCY_BROADCAST"]);

export const createNotificationBroadcastSchema = z.object({
  channel: notificationChannelSchema,
  templateKey: z.string().min(1).optional(),
  title: z.string().min(1).max(150),
  body: z.string().min(1).max(2000),
  targetingRules: targetingRulesSchema.optional(),
  scheduledFor: z.coerce.date().optional(),
});

export type CreateNotificationBroadcastPayload = z.infer<typeof createNotificationBroadcastSchema>;
