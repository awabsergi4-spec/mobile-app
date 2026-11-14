import { NextRequest } from "next/server";
import { createCompanySchema } from "@sahl/shared/schemas/company.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { createCompanyUseCase } from "@/infrastructure/company/company-services";
import { CompanyAlreadyExistsError } from "@/application/company/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const body = await req.json();
    const parsed = createCompanySchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const company = await createCompanyUseCase.execute({ ownerId: userId, ...parsed.data });
    return ok(company, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof CompanyAlreadyExistsError) {
      return fail("COMPANY_ALREADY_EXISTS", err.message, { status: 409 });
    }
    throw err;
  }
}
