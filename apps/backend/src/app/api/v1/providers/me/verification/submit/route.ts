import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { providerProfileRepository, submitProviderVerificationUseCase } from "@/infrastructure/provider/provider-services";
import {
  ProviderProfileNotFoundError,
  ProviderVerificationAlreadyPendingError,
  ProviderVerificationDocumentsRequiredError,
} from "@/application/provider/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const existing = await providerProfileRepository.findByUserId(userId);
    if (!existing) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    await submitProviderVerificationUseCase.execute({ providerId: existing.id });
    return ok({ verificationStatus: "PENDING_REVIEW" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ProviderProfileNotFoundError) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof ProviderVerificationDocumentsRequiredError) {
      return fail("VERIFICATION_DOCUMENTS_REQUIRED", err.message, { status: 422 });
    }
    if (err instanceof ProviderVerificationAlreadyPendingError) {
      return fail("VERIFICATION_ALREADY_PENDING", err.message, { status: 409 });
    }
    throw err;
  }
}
