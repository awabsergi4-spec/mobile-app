import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { reactivateCompanyUseCase } from "@/infrastructure/company/company-services";
import { CompanyNotFoundError } from "@/application/company/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "companies.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    await reactivateCompanyUseCase.execute({ companyId: id, actorId: userId });
    return ok({ status: "ACTIVE" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof CompanyNotFoundError) {
      return fail("COMPANY_NOT_FOUND", err.message, { status: 404 });
    }
    throw err;
  }
}
