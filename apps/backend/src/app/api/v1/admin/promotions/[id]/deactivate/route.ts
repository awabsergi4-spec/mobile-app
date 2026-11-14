import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { setPromotionActiveUseCase } from "@/infrastructure/promotion/promotion-services";
import { PromotionNotFoundError } from "@/application/promotion/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "promotions.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    await setPromotionActiveUseCase.execute({ promotionId: id, isActive: false, actorId: userId });
    return ok({ isActive: false });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof PromotionNotFoundError) {
      return fail("PROMOTION_NOT_FOUND", err.message, { status: 404 });
    }
    throw err;
  }
}
