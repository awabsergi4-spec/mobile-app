export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

// Interface only — implemented in infrastructure/identity/prisma-refresh-token-repository.ts.
// tokenHash is a fast cryptographic hash (sha256), not argon2id: a refresh
// token is already a high-entropy random value, not a low-entropy secret a
// human chose, so the slow/memory-hard properties PasswordHasher exists for
// don't apply here — see docs/05-security.md §1.
export interface RefreshTokenRepository {
  create(input: { userId: string; tokenHash: string; deviceInfo?: string; expiresAt: Date }): Promise<RefreshTokenRecord>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
