import { createHash } from "crypto";
import type { UserRepository } from "@/domain/identity/user.repository";
import type { OtpRepository, OtpPurpose } from "@/domain/identity/otp-repository";
import { SessionIssuer } from "./session-issuer";
import { UserNotFoundError } from "./errors";

export interface VerifyOtpInput {
  phone: string;
  code: string;
  purpose: OtpPurpose;
  deviceInfo?: string;
}

export type VerifyOtpResult =
  | { outcome: "verified" }
  | { outcome: "session"; accessToken: string; refreshToken: string };

export class OtpInvalidError extends Error {
  constructor() {
    super("Invalid or expired verification code");
  }
}

export class OtpAttemptsExceededError extends Error {
  constructor() {
    super("Too many incorrect attempts — request a new code");
  }
}

const MAX_ATTEMPTS = 5;

export class VerifyOtpUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly otps: OtpRepository,
    private readonly sessions: SessionIssuer,
  ) {}

  async execute(input: VerifyOtpInput): Promise<VerifyOtpResult> {
    const user = await this.users.findByPhone(input.phone);
    if (!user) {
      throw new UserNotFoundError();
    }

    const otp = await this.otps.findLatestActive(user.id, input.purpose);
    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      throw new OtpInvalidError();
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      throw new OtpAttemptsExceededError();
    }

    const providedHash = createHash("sha256").update(input.code).digest("hex");
    if (providedHash !== otp.codeHash) {
      await this.otps.incrementAttempts(otp.id);
      throw new OtpInvalidError();
    }

    await this.otps.markConsumed(otp.id);

    if (input.purpose === "PHONE_VERIFICATION" && user.status === "PENDING_VERIFICATION") {
      await this.users.updateStatus(user.id, "ACTIVE");
    }

    if (input.purpose === "LOGIN") {
      const session = await this.sessions.issue(user.id, input.deviceInfo);
      return { outcome: "session", ...session };
    }

    return { outcome: "verified" };
  }
}
