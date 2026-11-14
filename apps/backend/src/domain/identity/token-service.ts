export interface AccessTokenClaims {
  sub: string; // userId
}

// Interface only — implemented in infrastructure/identity/jwt-token-service.ts
// (RS256, per docs/05-security.md §1: asymmetric so the realtime service can
// verify tokens without holding the signing secret). Not built as a
// registry-resolved adapter like PaymentProvider/AIProvider — JWT is a
// standard with no vendor variability here, so a second interface+registry
// layer would be the "unnecessary abstraction" this phase's rules warn against.
export interface TokenService {
  issueAccessToken(userId: string): string;
  verifyAccessToken(token: string): AccessTokenClaims;
}
