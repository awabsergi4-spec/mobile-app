import { NextRequest } from "next/server";
import { inviteCompanyMemberSchema } from "@sahl/shared/schemas/company.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { companyMemberRepository, inviteCompanyMemberUseCase } from "@/infrastructure/company/company-services";
import { requireCompanyMembership, NotCompanyMemberError } from "@/presentation/company-guards";
import { CompanyInvitationAlreadyPendingError, CompanyMemberInsufficientRoleError } from "@/application/company/errors";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    await requireCompanyMembership(id, userId, companyMemberRepository);
    const members = await companyMemberRepository.listByCompanyId(id);
    return ok(members);
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

// Invites a phone number to join, rather than adding a member directly —
// the invited person may not have a User account yet. Authorization
// (OWNER/MANAGER only) is enforced inside InviteCompanyMemberUseCase itself.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const body = await req.json();
    const parsed = inviteCompanyMemberSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const invitation = await inviteCompanyMemberUseCase.execute({
      companyId: id,
      invitedById: userId,
      invitedPhone: parsed.data.invitedPhone,
      role: parsed.data.role,
    });
    return ok(invitation, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof CompanyMemberInsufficientRoleError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof CompanyInvitationAlreadyPendingError) {
      return fail("INVITATION_ALREADY_PENDING", err.message, { status: 409 });
    }
    throw err;
  }
}
