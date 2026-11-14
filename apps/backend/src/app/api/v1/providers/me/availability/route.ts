import { NextRequest } from "next/server";
import { setProviderAvailabilitySchema } from "@sahl/shared/schemas/provider.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { providerProfileRepository, setProviderAvailabilityUseCase } from "@/infrastructure/provider/provider-services";
import { ProviderProfileNotFoundError } from "@/application/provider/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const existing = await providerProfileRepository.findByUserId(userId);
    if (!existing) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    const body = await req.json();
    const parsed = setProviderAvailabilitySchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    await setProviderAvailabilityUseCase.execute({ providerId: existing.id, mode: parsed.data.mode });
    return ok({ mode: parsed.data.mode });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ProviderProfileNotFoundError) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", err.message, { status: 404 });
    }
    throw err;
  }
}
