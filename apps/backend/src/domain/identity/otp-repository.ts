export type OtpPurpose = "PHONE_VERIFICATION" | "EMAIL_VERIFICATION" | "LOGIN" | "PASSWORD_RESET" | "SENSITIVE_ACTION";

export interface OtpCodeRecord {
  id: string;
  userId: string;
  codeHash: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  consumedAt: Date | null;
  attempts: number;
  createdAt: Date;
}

// Interface only — implemented in infrastructure/identity/prisma-otp-repository.ts.
export interface OtpRepository {
  create(input: { userId: string; codeHash: string; purpose: OtpPurpose; expiresAt: Date }): Promise<OtpCodeRecord>;
  findLatestActive(userId: string, purpose: OtpPurpose): Promise<OtpCodeRecord | null>;
  incrementAttempts(id: string): Promise<void>;
  markConsumed(id: string): Promise<void>;
}
