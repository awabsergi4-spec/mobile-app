import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { onDemandRequestRepository } from "@/infrastructure/on-demand/on-demand-services";
import { ok, fail } from "@/presentation/http-response";
import type { OnDemandStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "services.manage", tokenService, staffPermissionRepository);

    const status = req.nextUrl.searchParams.get("status") as OnDemandStatus | null;
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    const limitParam = req.nextUrl.searchParams.get("limit");

    const requests = await onDemandRequestRepository.search({
      status: status ?? undefined,
      cursor,
      limit: limitParam ? Number(limitParam) : undefined,
    });

    return ok(requests);
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
