import jwt from "jsonwebtoken";
import type { AccessTokenClaims, TokenService } from "@/domain/identity/token-service";

export class InvalidAccessTokenError extends Error {
  constructor() {
    super("Invalid or expired access token");
  }
}

// RS256 (asymmetric) per docs/05-security.md §1 — the realtime service
// (src/realtime/server.ts) verifies tokens with the public key alone,
// never holding the signing secret.
export class JwtTokenService implements TokenService {
  constructor(
    private readonly privateKey: string,
    private readonly publicKey: string,
    private readonly accessTokenTtlSeconds: number,
  ) {}

  issueAccessToken(userId: string): string {
    return jwt.sign({}, this.privateKey, {
      algorithm: "RS256",
      subject: userId,
      expiresIn: this.accessTokenTtlSeconds,
    });
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    try {
      const payload = jwt.verify(token, this.publicKey, { algorithms: ["RS256"] });
      if (typeof payload === "string" || !payload.sub) {
        throw new InvalidAccessTokenError();
      }
      return { sub: payload.sub };
    } catch {
      throw new InvalidAccessTokenError();
    }
  }
}
