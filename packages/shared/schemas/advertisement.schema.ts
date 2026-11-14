import { z } from "zod";

// Matches AdType/AdPlacement/AdEventType in apps/backend/prisma/schema.prisma.
export const adTypeSchema = z.enum(["BANNER", "NATIVE", "SPONSORED_PROVIDER", "SPONSORED_SERVICE", "SPONSORED_CATEGORY"]);
export const adPlacementSchema = z.enum(["SEARCH_TOP", "CATEGORY_BANNER", "PROVIDER_FEATURED"]);
export const adEventTypeSchema = z.enum(["IMPRESSION", "CLICK", "CONVERSION"]);

export const createAdvertisementSchema = z.object({
  adType: adTypeSchema,
  placement: adPlacementSchema,
  providerId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  title: z.string().min(1).max(150),
  description: z.string().max(2000).optional(),
  ctaText: z.string().max(60).optional(),
  destinationUrl: z.string().url().optional(),
  creativeUrl: z.string().url().optional(),
  budgetMinorUnits: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  targetingRules: z.record(z.string(), z.unknown()).optional(),
  priority: z.number().int().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export type CreateAdvertisementPayload = z.infer<typeof createAdvertisementSchema>;

export const updateAdvertisementSchema = createAdvertisementSchema.partial();

export type UpdateAdvertisementPayload = z.infer<typeof updateAdvertisementSchema>;

export const setAdvertisementActiveSchema = z.object({
  isActive: z.boolean(),
});

export const recordAdEventSchema = z.object({
  type: adEventTypeSchema,
});
