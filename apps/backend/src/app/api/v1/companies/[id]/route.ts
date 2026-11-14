import { NextRequest } from "next/server";
import { updateCompanySchema } from "@sahl/shared/schemas/company.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { companyRepository, companyMemberRepository, updateCompanyUseCase } from "@/infrastructure/company/company-services";
import { requireCompanyMembership, requireCompanyRole, NotCompanyMemberError, CompanyRoleForbiddenError } from "@/presentation/company-guards";
import { CompanyNotFoundError } from "@/application/company/errors";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const company = await companyRepository.findById(id);
    if (!company) {
      return fail("COMPANY_NOT_FOUND", "Company not found", { status: 404 });
    }

    await requireCompanyMembership(id, userId, companyMemberRepository);
    return ok(company);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotCompanyMemberError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    throw err;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    await requireCompanyRole(id, userId, ["OWNER", "MANAGER"], companyMemberRepository);

    const body = await req.json();
    const parsed = updateCompanySchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const company = await updateCompanyUseCase.execute(id, parsed.data);
    return ok(company);
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
    throw err;
  }
}
