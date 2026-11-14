import { z } from "zod";

// Matches DiscountType in apps/backend/prisma/schema.prisma.
export const discountTypeSchema = z.enum(["PERCENTAGE", "FLAT"]);

export const createPromotionSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(2000).optional(),
  discountType: discountTypeSchema,
  discountValue: z.number().int().positive(),
  categoryId: z.string().min(1).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export type CreatePromotionPayload = z.infer<typeof createPromotionSchema>;

export const updatePromotionSchema = createPromotionSchema.partial();

export type UpdatePromotionPayload = z.infer<typeof updatePromotionSchema>;

export const setPromotionActiveSchema = z.object({
  isActive: z.boolean(),
});
