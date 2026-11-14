import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { companyRepository } from "@/infrastructure/company/company-services";
import { ok, fail } from "@/presentation/http-response";
import type { AccountLifecycleStatus, VerificationStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "companies.manage", tokenService, staffPermissionRepository);

    const query = req.nextUrl.searchParams.get("query") ?? undefined;
    const status = req.nextUrl.searchParams.get("status") as AccountLifecycleStatus | null;
    const verificationStatus = req.nextUrl.searchParams.get("verificationStatus") as VerificationStatus | null;
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    const limitParam = req.nextUrl.searchParams.get("limit");

    const companies = await companyRepository.search({
      query,
      status: status ?? undefined,
      verificationStatus: verificationStatus ?? undefined,
      cursor,
      limit: limitParam ? Number(limitParam) : undefined,
    });

    return ok(companies);
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
