import { NextRequest } from "next/server";
import { createProviderDocumentSchema } from "@sahl/shared/schemas/provider.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { providerProfileRepository, providerDocumentRepository } from "@/infrastructure/provider/provider-services";
import { ok, fail } from "@/presentation/http-response";

// Accepts an already-uploaded fileUrl (via the media upload flow documented
// in docs/04-api-modules.md) rather than handling the file bytes here —
// this route owns document metadata, not storage.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const profile = await providerProfileRepository.findByUserId(userId);
    if (!profile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    const documents = await providerDocumentRepository.listByProviderId(profile.id);
    return ok(documents);
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
    const parsed = createProviderDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const document = await providerDocumentRepository.create({ providerId: profile.id, ...parsed.data });
    return ok(document, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
