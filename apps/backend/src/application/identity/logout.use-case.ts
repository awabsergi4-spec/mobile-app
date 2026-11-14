import { createHash } from "crypto";
import type { RefreshTokenRepository } from "@/domain/identity/refresh-token-repository";

export interface LogoutInput {
  refreshToken: string;
}

// Idempotent by design: an unknown or already-revoked token still returns
// success — there's no useful signal to the caller in distinguishing
// "already logged out" from "logged out just now," and treating it as an
// error would leak whether a given token was ever valid.
export class LogoutUseCase {
  constructor(private readonly refreshTokens: RefreshTokenRepository) {}

  async execute(input: LogoutInput): Promise<void> {
    const tokenHash = createHash("sha256").update(input.refreshToken).digest("hex");
    const record = await this.refreshTokens.findByTokenHash(tokenHash);
    if (record && !record.revokedAt) {
      await this.refreshTokens.revoke(record.id);
    }
  }
}
