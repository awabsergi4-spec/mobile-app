import { randomUUID, createHash } from "crypto";
import type { User, UserStatus } from "@/domain/identity/user.entity";
import type { SearchUsersFilter, UserRepository } from "@/domain/identity/user.repository";
import type { PasswordHasher } from "@/domain/identity/password-hasher";
import type { OtpCodeRecord, OtpPurpose, OtpRepository } from "@/domain/identity/otp-repository";
import type { OtpSender } from "@/domain/identity/otp-sender";
import type { RefreshTokenRecord, RefreshTokenRepository } from "@/domain/identity/refresh-token-repository";
import type { AccessTokenClaims, TokenService } from "@/domain/identity/token-service";
import type { RemoteConfigReader } from "@/domain/config/remote-config-reader";

// Hand-written fakes, not a mocking library — every interface here is
// small enough that a real (if minimal) implementation is clearer than a
// mock-framework's stub/verify ceremony, and it exercises the actual
// interface contract rather than a recorded expectation.

export class FakeUserRepository implements UserRepository {
  private readonly byPhone = new Map<string, User>();

  seed(user: User): void {
    this.byPhone.set(user.phone, user);
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.byPhone.get(phone) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return [...this.byPhone.values()].find((u) => u.id === id) ?? null;
  }

  async search(filter: SearchUsersFilter): Promise<User[]> {
    return [...this.byPhone.values()].filter((u) => {
      if (filter.status && u.status !== filter.status) return false;
      if (filter.query) {
        const q = filter.query.toLowerCase();
        if (!u.phone.toLowerCase().includes(q) && !u.fullName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  async create(input: Omit<User, "id" | "createdAt" | "status"> & { status?: UserStatus }): Promise<User> {
    const user: User = { id: randomUUID(), createdAt: new Date(), status: input.status ?? "PENDING_VERIFICATION", ...input };
    this.byPhone.set(user.phone, user);
    return user;
  }

  async updateStatus(userId: string, status: UserStatus): Promise<void> {
    for (const user of this.byPhone.values()) {
      if (user.id === userId) {
        user.status = status;
      }
    }
  }
}

export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

export class FakeOtpRepository implements OtpRepository {
  private readonly rows = new Map<string, OtpCodeRecord>();

  async create(input: { userId: string; codeHash: string; purpose: OtpPurpose; expiresAt: Date }): Promise<OtpCodeRecord> {
    const record: OtpCodeRecord = { id: randomUUID(), attempts: 0, consumedAt: null, createdAt: new Date(), ...input };
    this.rows.set(record.id, record);
    return record;
  }

  async findLatestActive(userId: string, purpose: OtpPurpose): Promise<OtpCodeRecord | null> {
    const candidates = [...this.rows.values()]
      .filter((row) => row.userId === userId && row.purpose === purpose && !row.consumedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return candidates[0] ?? null;
  }

  async incrementAttempts(id: string): Promise<void> {
    const row = this.rows.get(id);
    if (row) row.attempts += 1;
  }

  async markConsumed(id: string): Promise<void> {
    const row = this.rows.get(id);
    if (row) row.consumedAt = new Date();
  }
}

export class FakeOtpSender implements OtpSender {
  readonly sent: { phone: string; code: string; purpose: OtpPurpose }[] = [];

  async send(phone: string, code: string, purpose: OtpPurpose): Promise<void> {
    this.sent.push({ phone, code, purpose });
  }
}

export class FakeRemoteConfigReader implements RemoteConfigReader {
  async getNumber(_key: string, fallback: number): Promise<number> {
    return fallback;
  }
}

export class FakeRefreshTokenRepository implements RefreshTokenRepository {
  private readonly rows = new Map<string, RefreshTokenRecord>();

  async create(input: { userId: string; tokenHash: string; deviceInfo?: string; expiresAt: Date }): Promise<RefreshTokenRecord> {
    const record: RefreshTokenRecord = { id: randomUUID(), revokedAt: null, ...input };
    this.rows.set(record.tokenHash, record);
    return record;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.rows.get(tokenHash) ?? null;
  }

  async revoke(id: string): Promise<void> {
    for (const row of this.rows.values()) {
      if (row.id === id) row.revokedAt = new Date();
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    for (const row of this.rows.values()) {
      if (row.userId === userId && !row.revokedAt) row.revokedAt = new Date();
    }
  }

  isRevoked(rawToken: string): boolean {
    const hash = createHash("sha256").update(rawToken).digest("hex");
    return this.rows.get(hash)?.revokedAt != null;
  }
}

export class FakeTokenService implements TokenService {
  issueAccessToken(userId: string): string {
    return `access:${userId}`;
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    if (!token.startsWith("access:")) {
      throw new Error("invalid token");
    }
    return { sub: token.slice("access:".length) };
  }
}
