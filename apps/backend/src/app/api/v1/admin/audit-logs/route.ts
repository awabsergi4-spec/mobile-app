import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { auditLogReader } from "@/infrastructure/audit/audit-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "audit.view", tokenService, staffPermissionRepository);

    const entries = await auditLogReader.search({
      actorId: req.nextUrl.searchParams.get("actorId") ?? undefined,
      entityType: req.nextUrl.searchParams.get("entityType") ?? undefined,
      entityId: req.nextUrl.searchParams.get("entityId") ?? undefined,
      action: req.nextUrl.searchParams.get("action") ?? undefined,
      cursor: req.nextUrl.searchParams.get("cursor") ?? undefined,
    });

    return ok(entries);
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
