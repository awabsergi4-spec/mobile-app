import { NextRequest } from "next/server";
import { reviewCompanyVerificationSchema } from "@sahl/shared/schemas/company.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { reviewCompanyVerificationUseCase } from "@/infrastructure/company/company-services";
import { CompanyNotFoundError } from "@/application/company/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "companies.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const body = await req.json();
    const parsed = reviewCompanyVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    await reviewCompanyVerificationUseCase.execute({
      companyId: id,
      decision: parsed.data.decision,
      reason: parsed.data.reason,
      actorId: userId,
    });
    return ok({ verificationStatus: parsed.data.decision });
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
