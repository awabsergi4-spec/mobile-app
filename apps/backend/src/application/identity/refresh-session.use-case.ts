import { createHash } from "crypto";
import type { RefreshTokenRepository } from "@/domain/identity/refresh-token-repository";
import { SessionIssuer, type IssuedSession } from "./session-issuer";

export interface RefreshSessionInput {
  refreshToken: string;
  deviceInfo?: string;
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Invalid or expired refresh token");
  }
}

export class RefreshTokenReuseDetectedError extends Error {
  constructor() {
    super("Refresh token reuse detected — all sessions have been revoked");
  }
}

// Rotation + reuse detection (docs/05-security.md §1): presenting a token
// that's already revoked is treated as evidence of theft — every active
// refresh token for that user is revoked in response. The existing
// RefreshToken schema has no token-family column, so this is coarser than
// a precise family-only revocation would be, but it correctly cuts off the
// compromised session lineage using the schema as already built — adding a
// family column now would be exactly the "redesign a completed module"
// this phase's rules rule out.
export class RefreshSessionUseCase {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly sessions: SessionIssuer,
  ) {}

  async execute(input: RefreshSessionInput): Promise<IssuedSession> {
    const tokenHash = createHash("sha256").update(input.refreshToken).digest("hex");
    const record = await this.refreshTokens.findByTokenHash(tokenHash);

    if (!record) {
      throw new InvalidRefreshTokenError();
    }

    if (record.revokedAt) {
      await this.refreshTokens.revokeAllForUser(record.userId);
      throw new RefreshTokenReuseDetectedError();
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new InvalidRefreshTokenError();
    }

    await this.refreshTokens.revoke(record.id);
    return this.sessions.issue(record.userId, input.deviceInfo);
  }
}
