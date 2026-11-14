import { createHash } from "crypto";
import { describe, it, expect } from "vitest";
import { VerifyOtpUseCase, OtpInvalidError, OtpAttemptsExceededError } from "../verify-otp.use-case";
import { UserNotFoundError } from "../errors";
import { SessionIssuer } from "../session-issuer";
import { FakeUserRepository, FakeOtpRepository, FakeRefreshTokenRepository, FakeTokenService } from "./fakes";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function seedUserAndOtp(purpose: "PHONE_VERIFICATION" | "LOGIN", code = "123456") {
  const users = new FakeUserRepository();
  const otps = new FakeOtpRepository();
  const user = await users.create({
    phone: "+15551234567",
    email: null,
    passwordHash: "hashed:x",
    fullName: "Amina Test",
    preferredLanguage: "en",
    regionId: "region-1",
    status: purpose === "LOGIN" ? "ACTIVE" : "PENDING_VERIFICATION",
  });
  await otps.create({
    userId: user.id,
    codeHash: sha256(code),
    purpose,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
  const refreshTokens = new FakeRefreshTokenRepository();
  const sessions = new SessionIssuer(new FakeTokenService(), refreshTokens, 30 * 24 * 60 * 60 * 1000);
  return { useCase: new VerifyOtpUseCase(users, otps, sessions), users, otps, user };
}

describe("VerifyOtpUseCase", () => {
  it("activates a PENDING_VERIFICATION user on a correct PHONE_VERIFICATION code", async () => {
    const { useCase, users, user } = await seedUserAndOtp("PHONE_VERIFICATION");

    const result = await useCase.execute({ phone: "+15551234567", code: "123456", purpose: "PHONE_VERIFICATION" });

    expect(result.outcome).toBe("verified");
    const stored = await users.findByPhone("+15551234567");
    expect(stored?.status).toBe("ACTIVE");
    expect(user.id).toBe(stored?.id);
  });

  it("issues a session for a correct LOGIN code", async () => {
    const { useCase } = await seedUserAndOtp("LOGIN");

    const result = await useCase.execute({ phone: "+15551234567", code: "123456", purpose: "LOGIN" });

    expect(result.outcome).toBe("session");
    if (result.outcome === "session") {
      expect(result.accessToken).toMatch(/^access:/);
    }
  });

  it("rejects a wrong code and records the attempt", async () => {
    const { useCase, otps, user } = await seedUserAndOtp("PHONE_VERIFICATION");

    await expect(
      useCase.execute({ phone: "+15551234567", code: "000000", purpose: "PHONE_VERIFICATION" }),
    ).rejects.toBeInstanceOf(OtpInvalidError);

    const record = await otps.findLatestActive(user.id, "PHONE_VERIFICATION");
    expect(record?.attempts).toBe(1);
  });

  it("locks out after too many wrong attempts", async () => {
    const { useCase } = await seedUserAndOtp("PHONE_VERIFICATION");

    for (let i = 0; i < 5; i++) {
      await expect(
        useCase.execute({ phone: "+15551234567", code: "000000", purpose: "PHONE_VERIFICATION" }),
      ).rejects.toBeInstanceOf(OtpInvalidError);
    }

    await expect(
      useCase.execute({ phone: "+15551234567", code: "123456", purpose: "PHONE_VERIFICATION" }),
    ).rejects.toBeInstanceOf(OtpAttemptsExceededError);
  });

  it("rejects an unknown phone", async () => {
    const users = new FakeUserRepository();
    const otps = new FakeOtpRepository();
    const refreshTokens = new FakeRefreshTokenRepository();
    const sessions = new SessionIssuer(new FakeTokenService(), refreshTokens, 1000);
    const useCase = new VerifyOtpUseCase(users, otps, sessions);

    await expect(
      useCase.execute({ phone: "+19999999999", code: "123456", purpose: "LOGIN" }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
