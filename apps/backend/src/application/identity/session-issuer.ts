import { randomBytes, createHash } from "crypto";
import type { TokenService } from "@/domain/identity/token-service";
import type { RefreshTokenRepository } from "@/domain/identity/refresh-token-repository";

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
}

// Shared by every use case that starts or rotates a session
// (LoginWithPasswordUseCase, VerifyOtpUseCase for LOGIN purpose,
// RefreshSessionUseCase) — issuing tokens is identical in all three, so it
// lives once here instead of being copied three times.
export class SessionIssuer {
  constructor(
    private readonly tokens: TokenService,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly refreshTokenTtlMs: number,
  ) {}

  async issue(userId: string, deviceInfo?: string): Promise<IssuedSession> {
    const accessToken = this.tokens.issueAccessToken(userId);
    const rawRefreshToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawRefreshToken).digest("hex");

    await this.refreshTokens.create({
      userId,
      tokenHash,
      deviceInfo,
      expiresAt: new Date(Date.now() + this.refreshTokenTtlMs),
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
