import { z } from "zod";

// Matches AvailabilityMode in apps/backend/prisma/schema.prisma — kept in
// sync by hand since Prisma enums aren't importable from packages/shared.
export const availabilityModeSchema = z.enum([
  "ONLINE",
  "OFFLINE",
  "VACATION",
  "TEMPORARILY_UNAVAILABLE",
  "EMERGENCY_OFFLINE",
]);

export const createProviderProfileSchema = z.object({
  businessName: z.string().min(2).max(120),
  bio: z.string().max(2000).optional(),
  yearsOfExperience: z.number().int().min(0).max(80).optional(),
  skills: z.array(z.string().min(1).max(60)).max(50).optional(),
  travelDistanceKm: z.number().min(0).max(1000).optional(),
  remoteAvailable: z.boolean().optional(),
});

export type CreateProviderProfilePayload = z.infer<typeof createProviderProfileSchema>;

export const updateProviderProfileSchema = z.object({
  businessName: z.string().min(2).max(120).optional(),
  bio: z.string().max(2000).optional(),
  businessLogoUrl: z.string().url().optional(),
  taxNumber: z.string().max(60).optional(),
  yearsOfExperience: z.number().int().min(0).max(80).optional(),
  skills: z.array(z.string().min(1).max(60)).max(50).optional(),
  travelDistanceKm: z.number().min(0).max(1000).optional(),
  remoteAvailable: z.boolean().optional(),
  emergencyAvailable: z.boolean().optional(),
  emergencyContactName: z.string().max(120).optional(),
  emergencyContactPhone: z.string().min(8).max(16).optional(),
});

export type UpdateProviderProfilePayload = z.infer<typeof updateProviderProfileSchema>;

export const suspendProviderSchema = z.object({
  reason: z.string().min(3).max(500),
});

export type SuspendProviderPayload = z.infer<typeof suspendProviderSchema>;

export const setProviderAvailabilitySchema = z.object({
  mode: availabilityModeSchema,
});

export type SetProviderAvailabilityPayload = z.infer<typeof setProviderAvailabilitySchema>;

export const createProviderDocumentSchema = z.object({
  type: z.string().min(2).max(60),
  fileUrl: z.string().url(),
});

export type CreateProviderDocumentPayload = z.infer<typeof createProviderDocumentSchema>;

// Matches DocumentStatus in apps/backend/prisma/schema.prisma.
export const reviewProviderDocumentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type ReviewProviderDocumentPayload = z.infer<typeof reviewProviderDocumentSchema>;

// Matches WithdrawalMethod in apps/backend/prisma/schema.prisma.
export const withdrawalMethodSchema = z.enum(["BANK_TRANSFER", "WALLET_TRANSFER", "MOBILE_MONEY"]);

export const createProviderPayoutAccountSchema = z.object({
  method: withdrawalMethodSchema,
  accountDetails: z.record(z.string(), z.unknown()),
  isDefault: z.boolean().optional(),
});

export type CreateProviderPayoutAccountPayload = z.infer<typeof createProviderPayoutAccountSchema>;

export const reviewProviderVerificationSchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED", "NEEDS_MORE_INFO"]),
  reason: z.string().min(3).max(500).optional(),
});

export type ReviewProviderVerificationPayload = z.infer<typeof reviewProviderVerificationSchema>;

export const createProviderPortfolioItemSchema = z.object({
  mediaUrl: z.string().url(),
  title: z.string().max(150).optional(),
  description: z.string().max(1000).optional(),
});

export type CreateProviderPortfolioItemPayload = z.infer<typeof createProviderPortfolioItemSchema>;
