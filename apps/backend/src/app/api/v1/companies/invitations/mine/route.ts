import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { prisma } from "@/infrastructure/prisma-client";
import { companyInvitationRepository, companyRepository } from "@/infrastructure/company/company-services";
import { ok, fail } from "@/presentation/http-response";

// Invitations are addressed by phone number (the invited person may not
// have a User account yet — see companies/[id]/members/route.ts), so "my
// invitations" resolves against the authenticated user's own phone, never
// a client-supplied value. Enriches each invitation with the inviting
// company's name since CompanyInvitation only stores companyId.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return fail("USER_NOT_FOUND", "User not found", { status: 404 });
    }

    const invitations = await companyInvitationRepository.findPendingByPhone(user.phone);
    const enriched = await Promise.all(
      invitations.map(async (invitation) => {
        const company = await companyRepository.findById(invitation.companyId);
        return { ...invitation, companyName: company?.name ?? null };
      }),
    );

    return ok(enriched);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
