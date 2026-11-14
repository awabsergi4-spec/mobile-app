import { describe, it, expect } from "vitest";
import { LoginWithPasswordUseCase, InvalidCredentialsError, AccountNotActiveError } from "../login-with-password.use-case";
import { SessionIssuer } from "../session-issuer";
import { FakeUserRepository, FakePasswordHasher, FakeRefreshTokenRepository, FakeTokenService } from "./fakes";

function buildUseCase() {
  const users = new FakeUserRepository();
  const hasher = new FakePasswordHasher();
  const refreshTokens = new FakeRefreshTokenRepository();
  const sessions = new SessionIssuer(new FakeTokenService(), refreshTokens, 30 * 24 * 60 * 60 * 1000);
  return { useCase: new LoginWithPasswordUseCase(users, hasher, sessions), users, refreshTokens };
}

describe("LoginWithPasswordUseCase", () => {
  it("issues a session for a correct password on an ACTIVE account", async () => {
    const { useCase, users } = buildUseCase();
    await users.seed({
      id: "user-1",
      phone: "+15551234567",
      email: null,
      passwordHash: "hashed:correct-horse-battery",
      fullName: "Amina Test",
      preferredLanguage: "en",
      status: "ACTIVE",
      regionId: "region-1",
      createdAt: new Date(),
    });

    const session = await useCase.execute({ phone: "+15551234567", password: "correct-horse-battery" });

    expect(session.accessToken).toBe("access:user-1");
    expect(session.refreshToken).toHaveLength(64); // 32 bytes hex-encoded
  });

  it("rejects a wrong password with the same error as an unknown phone", async () => {
    const { useCase, users } = buildUseCase();
    await users.seed({
      id: "user-1",
      phone: "+15551234567",
      email: null,
      passwordHash: "hashed:correct-horse-battery",
      fullName: "Amina Test",
      preferredLanguage: "en",
      status: "ACTIVE",
      regionId: "region-1",
      createdAt: new Date(),
    });

    await expect(
      useCase.execute({ phone: "+15551234567", password: "wrong-password" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(
      useCase.execute({ phone: "+19999999999", password: "wrong-password" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("rejects a correct password on a non-ACTIVE account", async () => {
    const { useCase, users } = buildUseCase();
    await users.seed({
      id: "user-1",
      phone: "+15551234567",
      email: null,
      passwordHash: "hashed:correct-horse-battery",
      fullName: "Amina Test",
      preferredLanguage: "en",
      status: "PENDING_VERIFICATION",
      regionId: "region-1",
      createdAt: new Date(),
    });

    await expect(
      useCase.execute({ phone: "+15551234567", password: "correct-horse-battery" }),
    ).rejects.toBeInstanceOf(AccountNotActiveError);
  });
});
