import type { NextRequest } from "next/server";
import type { TokenService } from "@/domain/identity/token-service";
import type { StaffPermissionRepository } from "@/domain/identity/staff-permission-repository";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Authentication required");
  }
}

export class ForbiddenError extends Error {
  constructor(permissionKey: string) {
    super(`Missing required permission: ${permissionKey}`);
  }
}

// Bearer-token extraction + verification, shared by every route that needs
// a caller identity. Route handlers call this directly (Next.js App Router
// has no Express-style middleware chain within a route handler) rather
// than through a second dispatch layer — see docs/04-api-modules.md §3.
export async function requireAuth(request: NextRequest, tokens: TokenService): Promise<{ userId: string }> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthenticatedError();
  }

  try {
    const claims = tokens.verifyAccessToken(header.slice("Bearer ".length));
    return { userId: claims.sub };
  } catch {
    throw new UnauthenticatedError();
  }
}

// Fail-closed RBAC (docs/05-security.md §2): missing or ambiguous
// permission always denies, never default-allows.
export async function requirePermission(
  request: NextRequest,
  permissionKey: string,
  tokens: TokenService,
  permissions: StaffPermissionRepository,
): Promise<{ userId: string }> {
  const { userId } = await requireAuth(request, tokens);
  const keys = await permissions.getPermissionKeys(userId);

  if (!keys.includes(permissionKey)) {
    throw new ForbiddenError(permissionKey);
  }

  return { userId };
}
