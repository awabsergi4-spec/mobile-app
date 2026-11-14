import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { companyMemberRepository, companyInvitationRepository } from "@/infrastructure/company/company-services";
import { requireCompanyRole, NotCompanyMemberError, CompanyRoleForbiddenError } from "@/presentation/company-guards";
import { ok, fail } from "@/presentation/http-response";

// Lists every invitation the company has sent (any status) so OWNER/MANAGER
// can see who's pending and cancel outstanding ones — mirrors the
// GET .../documents route's OWNER/MANAGER gate and shape.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    await requireCompanyRole(id, userId, ["OWNER", "MANAGER"], companyMemberRepository);
    const invitations = await companyInvitationRepository.listByCompanyId(id);
    return ok(invitations);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotCompanyMemberError || err instanceof CompanyRoleForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    throw err;
  }
}
