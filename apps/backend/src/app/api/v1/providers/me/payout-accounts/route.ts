import { NextRequest } from "next/server";
import { createProviderPayoutAccountSchema } from "@sahl/shared/schemas/provider.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { providerProfileRepository, providerPayoutAccountRepository } from "@/infrastructure/provider/provider-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const profile = await providerProfileRepository.findByUserId(userId);
    if (!profile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    const accounts = await providerPayoutAccountRepository.listByProviderId(profile.id);
    return ok(accounts);
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
    const parsed = createProviderPayoutAccountSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const account = await providerPayoutAccountRepository.create({ providerId: profile.id, ...parsed.data });
    return ok(account, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
