import { describe, it, expect } from "vitest";
import { LogoutUseCase } from "../logout.use-case";
import { SessionIssuer } from "../session-issuer";
import { FakeRefreshTokenRepository, FakeTokenService } from "./fakes";

describe("LogoutUseCase", () => {
  it("revokes the presented refresh token", async () => {
    const refreshTokens = new FakeRefreshTokenRepository();
    const sessions = new SessionIssuer(new FakeTokenService(), refreshTokens, 1000 * 60);
    const useCase = new LogoutUseCase(refreshTokens);
    const session = await sessions.issue("user-1");

    await useCase.execute({ refreshToken: session.refreshToken });

    expect(refreshTokens.isRevoked(session.refreshToken)).toBe(true);
  });

  it("is idempotent for an unknown token — does not throw", async () => {
    const refreshTokens = new FakeRefreshTokenRepository();
    const useCase = new LogoutUseCase(refreshTokens);

    await expect(useCase.execute({ refreshToken: "never-issued" })).resolves.toBeUndefined();
  });
});
