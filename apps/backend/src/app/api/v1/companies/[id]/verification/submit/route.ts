import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { companyMemberRepository, submitCompanyVerificationUseCase } from "@/infrastructure/company/company-services";
import { requireCompanyRole, NotCompanyMemberError, CompanyRoleForbiddenError } from "@/presentation/company-guards";
import {
  CompanyNotFoundError,
  CompanyVerificationAlreadyPendingError,
  CompanyVerificationDocumentsRequiredError,
} from "@/application/company/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    await requireCompanyRole(id, userId, ["OWNER", "MANAGER"], companyMemberRepository);

    await submitCompanyVerificationUseCase.execute({ companyId: id });
    return ok({ verificationStatus: "PENDING_REVIEW" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotCompanyMemberError || err instanceof CompanyRoleForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof CompanyNotFoundError) {
      return fail("COMPANY_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof CompanyVerificationDocumentsRequiredError) {
      return fail("VERIFICATION_DOCUMENTS_REQUIRED", err.message, { status: 422 });
    }
    if (err instanceof CompanyVerificationAlreadyPendingError) {
      return fail("VERIFICATION_ALREADY_PENDING", err.message, { status: 409 });
    }
    throw err;
  }
}
