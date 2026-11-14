import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { contractProjectRepository } from "@/infrastructure/contract/contract-services";
import { ok, fail } from "@/presentation/http-response";
import type { ContractProjectStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "services.manage", tokenService, staffPermissionRepository);

    const status = req.nextUrl.searchParams.get("status") as ContractProjectStatus | null;
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    const limitParam = req.nextUrl.searchParams.get("limit");

    const projects = await contractProjectRepository.search({
      status: status ?? undefined,
      cursor,
      limit: limitParam ? Number(limitParam) : undefined,
    });

    return ok(projects);
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
