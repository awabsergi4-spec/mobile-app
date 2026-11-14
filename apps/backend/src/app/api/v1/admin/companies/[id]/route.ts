import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { deleteCompanyUseCase } from "@/infrastructure/company/company-services";
import { CompanyNotFoundError } from "@/application/company/errors";
import { ok, fail } from "@/presentation/http-response";

// Soft delete only — see DeleteCompanyUseCase for why (financial/audit
// history integrity, ADR-008).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "companies.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    await deleteCompanyUseCase.execute({ companyId: id, actorId: userId });
    return ok({ status: "DELETED" });
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
