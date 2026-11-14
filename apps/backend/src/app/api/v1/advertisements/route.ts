import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { advertisementRepository } from "@/infrastructure/advertisement/advertisement-services";
import { ok, fail } from "@/presentation/http-response";
import type { AdPlacement } from "@prisma/client";

// Customer-facing ad slot — real backend data only (never a hardcoded
// Flutter ad list). Only currently-live ads for the requested placement.
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, tokenService);

    const placement = req.nextUrl.searchParams.get("placement") as AdPlacement | null;
    if (!placement) {
      return fail("VALIDATION_ERROR", "placement query parameter is required", { status: 400 });
    }

    const ads = await advertisementRepository.findActiveForPlacement(placement, new Date());
    return ok(ads);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
