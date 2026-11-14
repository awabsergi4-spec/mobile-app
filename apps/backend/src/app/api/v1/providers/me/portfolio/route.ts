import { NextRequest } from "next/server";
import { createProviderPortfolioItemSchema } from "@sahl/shared/schemas/provider.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { providerProfileRepository, providerPortfolioRepository } from "@/infrastructure/provider/provider-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const profile = await providerProfileRepository.findByUserId(userId);
    if (!profile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    const items = await providerPortfolioRepository.listByProviderId(profile.id);
    return ok(items);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const profile = await providerProfileRepository.findByUserId(userId);
    if (!profile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    const body = await req.json();
    const parsed = createProviderPortfolioItemSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const item = await providerPortfolioRepository.create({ providerId: profile.id, ...parsed.data });
    return ok(item, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
