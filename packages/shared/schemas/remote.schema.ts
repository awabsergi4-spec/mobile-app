import { z } from "zod";

// Matches PriceType in apps/backend/prisma/schema.prisma.
export const priceTypeSchema = z.enum(["FIXED", "HOURLY"]);

export const createRemoteEngagementSchema = z.object({
  providerId: z.string().min(1),
  categoryId: z.string().min(1),
  title: z.string().min(3).max(150),
  priceType: priceTypeSchema,
  amount: z.number().int().positive(),
});

export type CreateRemoteEngagementPayload = z.infer<typeof createRemoteEngagementSchema>;

export const createRemoteMilestoneSchema = z.object({
  title: z.string().min(2).max(150),
  amount: z.number().int().positive(),
  dueDate: z.coerce.date().optional(),
});

export type CreateRemoteMilestonePayload = z.infer<typeof createRemoteMilestoneSchema>;

export const updateRemoteMilestoneStatusSchema = z.object({
  toStatus: z.enum(["IN_PROGRESS", "SUBMITTED", "APPROVED", "PAID"]),
});

export type UpdateRemoteMilestoneStatusPayload = z.infer<typeof updateRemoteMilestoneStatusSchema>;

export const requestRemoteRevisionSchema = z.object({
  notes: z.string().min(3).max(2000),
});

export type RequestRemoteRevisionPayload = z.infer<typeof requestRemoteRevisionSchema>;

export const updateRemoteRevisionStatusSchema = z.object({
  toStatus: z.enum(["IN_PROGRESS", "RESOLVED"]),
});

export type UpdateRemoteRevisionStatusPayload = z.infer<typeof updateRemoteRevisionStatusSchema>;

export const scheduleRemoteMeetingSchema = z.object({
  scheduledAt: z.coerce.date(),
  joinUrl: z.string().url().optional(),
});

export type ScheduleRemoteMeetingPayload = z.infer<typeof scheduleRemoteMeetingSchema>;
