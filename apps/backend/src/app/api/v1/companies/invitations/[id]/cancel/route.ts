import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { cancelCompanyInvitationUseCase } from "@/infrastructure/company/company-services";
import {
  CompanyInvitationNotFoundError,
  CompanyInvitationNotPendingError,
  CompanyMemberInsufficientRoleError,
} from "@/application/company/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    await cancelCompanyInvitationUseCase.execute({ invitationId: id, actorId: userId });
    return ok({ status: "CANCELLED" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof CompanyMemberInsufficientRoleError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof CompanyInvitationNotFoundError) {
      return fail("COMPANY_INVITATION_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof CompanyInvitationNotPendingError) {
      return fail("COMPANY_INVITATION_NOT_PENDING", err.message, { status: 409 });
    }
    throw err;
  }
}
