import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { homeLayoutRepository } from "@/infrastructure/home-layout/home-layout-services";
import { ok, fail } from "@/presentation/http-response";

// The Dynamic Home Builder's read side (ADR-007) — Flutter's home screen
// renders exactly this ordered block list, nothing hardcoded client-side.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const blocks = await homeLayoutRepository.findForUser(userId, new Date());
    return ok(blocks);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
