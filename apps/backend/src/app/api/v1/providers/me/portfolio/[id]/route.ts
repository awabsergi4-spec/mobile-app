import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { providerProfileRepository, providerPortfolioRepository } from "@/infrastructure/provider/provider-services";
import { ok, fail } from "@/presentation/http-response";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const profile = await providerProfileRepository.findByUserId(userId);
    if (!profile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    const item = await providerPortfolioRepository.findById(id);
    if (!item || item.providerId !== profile.id) {
      return fail("PORTFOLIO_ITEM_NOT_FOUND", "Portfolio item not found", { status: 404 });
    }

    await providerPortfolioRepository.delete(id);
    return ok({ deleted: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
