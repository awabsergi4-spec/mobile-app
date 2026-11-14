import { describe, it, expect } from "vitest";
import {
  RefreshSessionUseCase,
  InvalidRefreshTokenError,
  RefreshTokenReuseDetectedError,
} from "../refresh-session.use-case";
import { SessionIssuer } from "../session-issuer";
import { FakeRefreshTokenRepository, FakeTokenService } from "./fakes";

function buildUseCase() {
  const refreshTokens = new FakeRefreshTokenRepository();
  const sessions = new SessionIssuer(new FakeTokenService(), refreshTokens, 30 * 24 * 60 * 60 * 1000);
  return { useCase: new RefreshSessionUseCase(refreshTokens, sessions), refreshTokens, sessions };
}

describe("RefreshSessionUseCase", () => {
  it("rotates a valid refresh token: old is revoked, a new one is issued", async () => {
    const { useCase, refreshTokens, sessions } = buildUseCase();
    const first = await sessions.issue("user-1");

    const rotated = await useCase.execute({ refreshToken: first.refreshToken });

    expect(rotated.refreshToken).not.toBe(first.refreshToken);
    expect(refreshTokens.isRevoked(first.refreshToken)).toBe(true);
  });

  it("rejects an unknown refresh token", async () => {
    const { useCase } = buildUseCase();

    await expect(useCase.execute({ refreshToken: "not-a-real-token" })).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
  });

  it("treats reuse of an already-rotated token as theft and revokes every active session", async () => {
    const { useCase, refreshTokens, sessions } = buildUseCase();
    const first = await sessions.issue("user-1");
    const second = await sessions.issue("user-1"); // a second, independent active session

    await useCase.execute({ refreshToken: first.refreshToken }); // rotates `first`, revoking it

    await expect(useCase.execute({ refreshToken: first.refreshToken })).rejects.toBeInstanceOf(
      RefreshTokenReuseDetectedError,
    );
    // the reuse response revokes every active token for the user, including the unrelated second session
    expect(refreshTokens.isRevoked(second.refreshToken)).toBe(true);
  });
});
