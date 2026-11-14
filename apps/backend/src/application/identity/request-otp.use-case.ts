import { randomInt, createHash } from "crypto";
import type { UserRepository } from "@/domain/identity/user.repository";
import type { OtpRepository, OtpPurpose } from "@/domain/identity/otp-repository";
import type { OtpSender } from "@/domain/identity/otp-sender";
import type { RemoteConfigReader } from "@/domain/config/remote-config-reader";
import { UserNotFoundError } from "./errors";

export interface RequestOtpInput {
  phone: string;
  purpose: OtpPurpose;
}

export class OtpRequestedTooSoonError extends Error {
  constructor() {
    super("A verification code was already sent recently — please wait before requesting another");
  }
}

const DEFAULT_OTP_EXPIRY_SECONDS = 300; // 5 minutes
const DEFAULT_MIN_RESEND_INTERVAL_SECONDS = 60;

// OTP expiry / resend interval are RemoteConfigEntry-backed (ADR-007 "OTP
// Settings") rather than hardcoded, so an operator can tighten/loosen them
// without a deploy — falls back to the defaults above when unconfigured.
export class RequestOtpUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly otps: OtpRepository,
    private readonly sender: OtpSender,
    private readonly config: RemoteConfigReader,
  ) {}

  async execute(input: RequestOtpInput): Promise<{ otpId: string }> {
    const user = await this.users.findByPhone(input.phone);
    if (!user) {
      throw new UserNotFoundError();
    }

    const existing = await this.otps.findLatestActive(user.id, input.purpose);
    const minResendIntervalSeconds = await this.config.getNumber(
      "otp.min_resend_interval_seconds",
      DEFAULT_MIN_RESEND_INTERVAL_SECONDS,
    );
    if (existing && Date.now() - existing.createdAt.getTime() < minResendIntervalSeconds * 1000) {
      throw new OtpRequestedTooSoonError();
    }

    const expirySeconds = await this.config.getNumber("otp.expiry_seconds", DEFAULT_OTP_EXPIRY_SECONDS);
    const code = randomInt(100000, 1000000).toString(); // 6 digits, 100000-999999 inclusive
    const codeHash = createHash("sha256").update(code).digest("hex");

    const otp = await this.otps.create({
      userId: user.id,
      codeHash,
      purpose: input.purpose,
      expiresAt: new Date(Date.now() + expirySeconds * 1000),
    });

    await this.sender.send(input.phone, code, input.purpose);

    return { otpId: otp.id };
  }
}
