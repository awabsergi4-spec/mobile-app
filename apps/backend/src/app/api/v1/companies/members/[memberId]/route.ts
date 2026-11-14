import { NextRequest } from "next/server";
import { updateCompanyMemberRoleSchema } from "@sahl/shared/schemas/company.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { removeCompanyMemberUseCase, updateCompanyMemberRoleUseCase } from "@/infrastructure/company/company-services";
import {
  CompanyMemberInsufficientRoleError,
  CompanyMemberNotFoundError,
  CompanyOwnerRoleProtectedError,
} from "@/application/company/errors";
import { ok, fail } from "@/presentation/http-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { memberId } = await params;

    const body = await req.json();
    const parsed = updateCompanyMemberRoleSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const member = await updateCompanyMemberRoleUseCase.execute({ memberId, role: parsed.data.role, actorId: userId });
    return ok(member);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof CompanyMemberInsufficientRoleError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof CompanyOwnerRoleProtectedError) {
      return fail("COMPANY_OWNER_ROLE_PROTECTED", err.message, { status: 409 });
    }
    if (err instanceof CompanyMemberNotFoundError) {
      return fail("COMPANY_MEMBER_NOT_FOUND", err.message, { status: 404 });
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { memberId } = await params;

    await removeCompanyMemberUseCase.execute({ memberId, actorId: userId });
    return ok({ removed: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof CompanyMemberInsufficientRoleError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof CompanyOwnerRoleProtectedError) {
      return fail("COMPANY_OWNER_ROLE_PROTECTED", err.message, { status: 409 });
    }
    if (err instanceof CompanyMemberNotFoundError) {
      return fail("COMPANY_MEMBER_NOT_FOUND", err.message, { status: 404 });
    }
    throw err;
  }
}
