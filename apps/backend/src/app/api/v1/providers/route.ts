import { NextRequest } from "next/server";
import { createProviderProfileSchema } from "@sahl/shared/schemas/provider.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { createProviderProfileUseCase, providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { ProviderProfileAlreadyExistsError } from "@/application/provider/errors";
import { ok, fail } from "@/presentation/http-response";

// Public "browse providers to hire" — real ACTIVE+VERIFIED providers only,
// output-shaped to public-safe fields (never taxNumber, emergency contact
// info, etc. — same discipline as GET /users/me). What Flutter's Remote
// engagement creation flow (customer picks a specific provider up front,
// unlike On-Demand/Contract's matching/bidding) needs to populate its
// provider picker.
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, tokenService);

    const categoryId = req.nextUrl.searchParams.get("categoryId") ?? undefined;
    const remoteAvailableParam = req.nextUrl.searchParams.get("remoteAvailable");

    const providers = await providerProfileRepository.search({
      status: "ACTIVE",
      verificationStatus: "VERIFIED",
      categoryId,
      remoteAvailable: remoteAvailableParam === "true" ? true : undefined,
    });

    return ok(
      providers.map((p) => ({
        id: p.id,
        businessName: p.businessName,
        bio: p.bio,
        ratingAverage: p.ratingAverage,
        ratingCount: p.ratingCount,
        skills: p.skills,
      })),
    );
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}

// Creates the provider profile for the currently authenticated user — a
// user "becomes" a provider this way rather than through a separate signup
// flow, per ADR-004's "one identity, dual role" principle.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const body = await req.json();
    const parsed = createProviderProfileSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const profile = await createProviderProfileUseCase.execute({ userId, ...parsed.data });
    return ok(profile, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ProviderProfileAlreadyExistsError) {
      return fail("PROVIDER_PROFILE_ALREADY_EXISTS", err.message, { status: 409 });
    }
    throw err;
  }
}
