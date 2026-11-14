import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { prisma } from "@/infrastructure/prisma-client";
import { acceptCompanyInvitationUseCase } from "@/infrastructure/company/company-services";
import {
  CompanyInvitationExpiredError,
  CompanyInvitationNotFoundError,
  CompanyInvitationNotPendingError,
  CompanyMemberAlreadyExistsError,
} from "@/application/company/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return fail("USER_NOT_FOUND", "User not found", { status: 404 });
    }

    const member = await acceptCompanyInvitationUseCase.execute({
      invitationId: id,
      acceptingUserId: userId,
      acceptingUserPhone: user.phone,
    });
    return ok(member);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof CompanyInvitationNotFoundError) {
      return fail("COMPANY_INVITATION_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof CompanyInvitationNotPendingError) {
      return fail("COMPANY_INVITATION_NOT_PENDING", err.message, { status: 409 });
    }
    if (err instanceof CompanyInvitationExpiredError) {
      return fail("COMPANY_INVITATION_EXPIRED", err.message, { status: 410 });
    }
    if (err instanceof CompanyMemberAlreadyExistsError) {
      return fail("COMPANY_MEMBER_ALREADY_EXISTS", err.message, { status: 409 });
    }
    throw err;
  }
}
