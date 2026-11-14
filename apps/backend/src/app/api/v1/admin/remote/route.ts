import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { remoteEngagementRepository } from "@/infrastructure/remote/remote-services";
import { ok, fail } from "@/presentation/http-response";
import type { RemoteEngagementStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "services.manage", tokenService, staffPermissionRepository);

    const status = req.nextUrl.searchParams.get("status") as RemoteEngagementStatus | null;
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    const limitParam = req.nextUrl.searchParams.get("limit");

    const engagements = await remoteEngagementRepository.search({
      status: status ?? undefined,
      cursor,
      limit: limitParam ? Number(limitParam) : undefined,
    });

    return ok(engagements);
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
