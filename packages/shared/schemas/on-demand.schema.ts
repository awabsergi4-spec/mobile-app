import { z } from "zod";

// Matches FulfillmentMode in apps/backend/prisma/schema.prisma — kept in
// sync by hand since Prisma enums aren't importable from packages/shared.
export const fulfillmentModeSchema = z.enum(["INSTANT", "SCHEDULED"]);

export const createOnDemandRequestSchema = z
  .object({
    categoryId: z.string().min(1),
    description: z.string().min(5).max(2000),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    fulfillmentMode: fulfillmentModeSchema.optional(),
    scheduledFor: z.coerce.date().optional(),
    isEmergency: z.boolean().optional(),
  })
  .refine((data) => data.fulfillmentMode !== "SCHEDULED" || data.scheduledFor != null, {
    message: "scheduledFor is required when fulfillmentMode is SCHEDULED",
    path: ["scheduledFor"],
  })
  .refine((data) => data.scheduledFor == null || data.scheduledFor.getTime() > Date.now(), {
    message: "scheduledFor must be in the future",
    path: ["scheduledFor"],
  });

export type CreateOnDemandRequestPayload = z.infer<typeof createOnDemandRequestSchema>;

export const updateOnDemandStatusSchema = z.object({
  toStatus: z.enum(["EN_ROUTE", "IN_PROGRESS", "COMPLETED"]),
});

export type UpdateOnDemandStatusPayload = z.infer<typeof updateOnDemandStatusSchema>;

export const recordTrackingPingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type RecordTrackingPingPayload = z.infer<typeof recordTrackingPingSchema>;
