import { z } from "zod";

// Matches CompanyRole in apps/backend/prisma/schema.prisma — kept in sync
// by hand since Prisma enums aren't importable from packages/shared.
export const companyRoleSchema = z.enum(["OWNER", "MANAGER", "STAFF"]);

export const createCompanySchema = z.object({
  name: z.string().min(2).max(150),
  regionId: z.string().min(1),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional(),
});

export type CreateCompanyPayload = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional(),
});

export type UpdateCompanyPayload = z.infer<typeof updateCompanySchema>;

export const suspendCompanySchema = z.object({
  reason: z.string().min(3).max(500),
});

export type SuspendCompanyPayload = z.infer<typeof suspendCompanySchema>;

export const reviewCompanyVerificationSchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED", "NEEDS_MORE_INFO"]),
  reason: z.string().min(3).max(500).optional(),
});

export type ReviewCompanyVerificationPayload = z.infer<typeof reviewCompanyVerificationSchema>;

export const createCompanyDocumentSchema = z.object({
  type: z.string().min(2).max(60),
  fileUrl: z.string().url(),
});

export type CreateCompanyDocumentPayload = z.infer<typeof createCompanyDocumentSchema>;

// Matches DocumentStatus in apps/backend/prisma/schema.prisma.
export const reviewCompanyDocumentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type ReviewCompanyDocumentPayload = z.infer<typeof reviewCompanyDocumentSchema>;

export const inviteCompanyMemberSchema = z.object({
  invitedPhone: z.string().min(8).max(16),
  role: companyRoleSchema.exclude(["OWNER"]).optional(),
});

export type InviteCompanyMemberPayload = z.infer<typeof inviteCompanyMemberSchema>;

export const updateCompanyMemberRoleSchema = z.object({
  role: companyRoleSchema.exclude(["OWNER"]),
});

export type UpdateCompanyMemberRolePayload = z.infer<typeof updateCompanyMemberRoleSchema>;
