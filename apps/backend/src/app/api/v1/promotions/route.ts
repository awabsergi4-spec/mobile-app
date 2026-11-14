import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { promotionRepository } from "@/infrastructure/promotion/promotion-services";
import { ok, fail } from "@/presentation/http-response";

// Customer-facing promotions surface — real backend data only. Only
// currently-live promotions, optionally scoped to a single category.
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, tokenService);

    const categoryId = req.nextUrl.searchParams.get("categoryId") ?? undefined;

    const promotions = await promotionRepository.findActive(new Date(), categoryId);
    return ok(promotions);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
