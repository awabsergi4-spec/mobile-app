import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { providerProfileRepository, providerPayoutAccountRepository } from "@/infrastructure/provider/provider-services";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const profile = await providerProfileRepository.findByUserId(userId);
    if (!profile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    const account = await providerPayoutAccountRepository.findById(id);
    if (!account || account.providerId !== profile.id) {
      return fail("PAYOUT_ACCOUNT_NOT_FOUND", "Payout account not found", { status: 404 });
    }

    await providerPayoutAccountRepository.setDefault(profile.id, id);
    return ok({ defaultPayoutAccountId: id });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
