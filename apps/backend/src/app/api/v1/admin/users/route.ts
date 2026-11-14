import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository, userRepository } from "@/infrastructure/identity/auth-services";
import { ok, fail } from "@/presentation/http-response";
import type { UserStatus } from "@prisma/client";

// Never serialize passwordHash — same output-shaping discipline as
// /api/v1/users/me (docs/05-security.md §3).
function toAdminUserSummary(user: Awaited<ReturnType<typeof userRepository.search>>[number]) {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    fullName: user.fullName,
    preferredLanguage: user.preferredLanguage,
    status: user.status,
    createdAt: user.createdAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "users.manage", tokenService, staffPermissionRepository);

    const query = req.nextUrl.searchParams.get("query") ?? undefined;
    const status = req.nextUrl.searchParams.get("status") as UserStatus | null;
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    const limitParam = req.nextUrl.searchParams.get("limit");

    const users = await userRepository.search({
      query,
      status: status ?? undefined,
      cursor,
      limit: limitParam ? Number(limitParam) : undefined,
    });

    return ok(users.map(toAdminUserSummary));
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    throw err;
  }
}
