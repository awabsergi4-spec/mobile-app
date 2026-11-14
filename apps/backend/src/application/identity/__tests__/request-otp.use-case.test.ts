import { describe, it, expect } from "vitest";
import { RequestOtpUseCase, OtpRequestedTooSoonError } from "../request-otp.use-case";
import { UserNotFoundError } from "../errors";
import { FakeUserRepository, FakeOtpRepository, FakeOtpSender, FakeRemoteConfigReader } from "./fakes";

function buildUseCase() {
  const users = new FakeUserRepository();
  const otps = new FakeOtpRepository();
  const sender = new FakeOtpSender();
  const useCase = new RequestOtpUseCase(users, otps, sender, new FakeRemoteConfigReader());
  return { useCase, users, otps, sender };
}

describe("RequestOtpUseCase", () => {
  it("generates and sends a 6-digit code for a known phone", async () => {
    const { useCase, users, sender } = buildUseCase();
    await users.seed({
      id: "user-1",
      phone: "+15551234567",
      email: null,
      passwordHash: "hashed:x",
      fullName: "Amina Test",
      preferredLanguage: "en",
      status: "PENDING_VERIFICATION",
      regionId: "region-1",
      createdAt: new Date(),
    });

    await useCase.execute({ phone: "+15551234567", purpose: "PHONE_VERIFICATION" });

    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0]?.code).toMatch(/^\d{6}$/);
    expect(sender.sent[0]?.phone).toBe("+15551234567");
  });

  it("rejects an unknown phone number", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({ phone: "+19999999999", purpose: "PHONE_VERIFICATION" }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it("rejects a resend within the minimum interval", async () => {
    const { useCase, users } = buildUseCase();
    await users.seed({
      id: "user-1",
      phone: "+15551234567",
      email: null,
      passwordHash: "hashed:x",
      fullName: "Amina Test",
      preferredLanguage: "en",
      status: "PENDING_VERIFICATION",
      regionId: "region-1",
      createdAt: new Date(),
    });

    await useCase.execute({ phone: "+15551234567", purpose: "PHONE_VERIFICATION" });

    await expect(
      useCase.execute({ phone: "+15551234567", purpose: "PHONE_VERIFICATION" }),
    ).rejects.toBeInstanceOf(OtpRequestedTooSoonError);
  });
});
