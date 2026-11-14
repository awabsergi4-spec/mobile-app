import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { prisma } from "@/infrastructure/prisma-client";
import { ok, fail } from "@/presentation/http-response";

// Output shaping (docs/05-security.md §3): the domain User entity is never
// serialized directly — passwordHash in particular must never leave the API.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        providerProfile: { select: { id: true, companyId: true } },
        companiesOwned: { select: { id: true }, take: 1 },
        companyMemberships: { select: { companyId: true, role: true }, take: 1 },
      },
    });
    if (!user) {
      return fail("USER_NOT_FOUND", "User not found", { status: 404 });
    }

    return ok({
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
      profilePictureUrl: user.profilePictureUrl,
      createdAt: user.createdAt,
      // Role-derivation signals for the Flutter app's Home shell routing —
      // never guessed client-side, always read off real DB relations.
      // COMPANY > PROVIDER > CUSTOMER priority when a user has more than one.
      providerProfile: user.providerProfile ? { id: user.providerProfile.id, companyId: user.providerProfile.companyId } : null,
      ownedCompanyId: user.companiesOwned[0]?.id ?? null,
      companyMembership: user.companyMemberships[0]
        ? { companyId: user.companyMemberships[0].companyId, role: user.companyMemberships[0].role }
        : null,
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
