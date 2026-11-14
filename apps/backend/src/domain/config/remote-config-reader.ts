// Interface only — implemented in infrastructure/config/prisma-remote-config-reader.ts.
// Reads RemoteConfigEntry (ADR-007): OTP expiry/attempt limits and similar
// scalar settings are admin-configurable without a deploy, per "OTP
// Settings" in docs/00-admin-panel-spec.md. Falls back to the caller-supplied
// default when no row exists yet (nothing seeded, or a fresh environment),
// so a missing config row is a normal case, not an error.
export interface RemoteConfigReader {
  getNumber(key: string, fallback: number, regionId?: string): Promise<number>;
}
