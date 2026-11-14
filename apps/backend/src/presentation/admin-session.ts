import { cookies } from "next/headers";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import type { IssuedSession } from "@/application/identity/session-issuer";

export const ADMIN_ACCESS_COOKIE = "sahl_admin_access";
export const ADMIN_REFRESH_COOKIE = "sahl_admin_refresh";

export interface AdminSession {
  userId: string;
  permissionKeys: string[];
}

export class ForbiddenAdminError extends Error {
  constructor(permissionKey: string) {
    super(`Missing required permission: ${permissionKey}`);
  }
}

// The Admin Platform's equivalent of presentation/auth-guards.ts —
// identical verification (tokenService.verifyAccessToken) and identical
// authorization source (StaffPermissionRepository), just reading the token
// from an httpOnly cookie instead of an Authorization header, since these
// are server-rendered pages, not a Bearer-header API client. No new JWT
// logic, no new RBAC logic — only the token-transport differs.
//
// Known limitation (Phase B): the access-token cookie expires with the JWT
// itself (ACCESS_TOKEN_TTL, 15m by default) and there is no silent-refresh
// here yet — an expired session redirects to /admin/login rather than
// transparently refreshing (that would need either an Edge-safe refresh
// path or a Node-runtime middleware hop; deferred rather than built
// fragile under this pass's time constraint).
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const accessToken = store.get(ADMIN_ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  try {
    const claims = tokenService.verifyAccessToken(accessToken);
    const permissionKeys = await staffPermissionRepository.getPermissionKeys(claims.sub);
    // Fail closed: an authenticated user with zero staff permissions isn't
    // an admin session at all, same principle as requirePermission's
    // "missing or ambiguous permission always denies."
    if (permissionKeys.length === 0) return null;
    return { userId: claims.sub, permissionKeys };
  } catch {
    return null;
  }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new ForbiddenAdminError("*");
  }
  return session;
}

export async function requireAdminPermission(permissionKey: string): Promise<AdminSession> {
  const session = await requireAdminSession();
  if (!session.permissionKeys.includes(permissionKey)) {
    throw new ForbiddenAdminError(permissionKey);
  }
  return session;
}

const isProduction = process.env.NODE_ENV === "production";

export async function setAdminSessionCookies(session: IssuedSession): Promise<void> {
  const store = await cookies();
  const shared = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
  };
  // Cookie maxAge tracks the JWT's own short lifetime — there is no
  // separate "remember me" concept here, see the Phase B limitation above.
  store.set(ADMIN_ACCESS_COOKIE, session.accessToken, { ...shared, maxAge: 15 * 60 });
  store.set(ADMIN_REFRESH_COOKIE, session.refreshToken, { ...shared, maxAge: 30 * 24 * 60 * 60 });
}

export async function clearAdminSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_ACCESS_COOKIE);
  store.delete(ADMIN_REFRESH_COOKIE);
}
