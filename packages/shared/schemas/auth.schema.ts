import { z } from "zod";

// Defined once, consumed by the Next.js route handler (validation) and
// exported to Dart for the Flutter client (form validation), so the two
// clients can never drift on what a valid registration payload looks like.
export const registerUserSchema = z.object({
  phone: z.string().min(8).max(16),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(120),
  preferredLanguage: z.enum(["en", "ar"]),
});

export type RegisterUserPayload = z.infer<typeof registerUserSchema>;

const phoneSchema = z.string().min(8).max(16);

export const loginWithPasswordSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1).max(72),
  deviceInfo: z.string().max(255).optional(),
});

export type LoginWithPasswordPayload = z.infer<typeof loginWithPasswordSchema>;

// Matches OtpPurpose in apps/backend/prisma/schema.prisma — kept in sync by
// hand since Prisma enums aren't importable from packages/shared.
export const otpPurposeSchema = z.enum([
  "PHONE_VERIFICATION",
  "EMAIL_VERIFICATION",
  "LOGIN",
  "PASSWORD_RESET",
  "SENSITIVE_ACTION",
]);

export const requestOtpSchema = z.object({
  phone: phoneSchema,
  purpose: otpPurposeSchema,
});

export type RequestOtpPayload = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6),
  purpose: otpPurposeSchema,
  deviceInfo: z.string().max(255).optional(),
});

export type VerifyOtpPayload = z.infer<typeof verifyOtpSchema>;

export const refreshSessionSchema = z.object({
  refreshToken: z.string().min(1),
  deviceInfo: z.string().max(255).optional(),
});

export type RefreshSessionPayload = z.infer<typeof refreshSessionSchema>;

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LogoutPayload = z.infer<typeof logoutSchema>;
