import { NextRequest } from "next/server";
import { updatePromotionSchema } from "@sahl/shared/schemas/promotion.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { promotionRepository, updatePromotionUseCase } from "@/infrastructure/promotion/promotion-services";
import { PromotionNotFoundError } from "@/application/promotion/errors";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(req, "promotions.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const promotion = await promotionRepository.findById(id);
    if (!promotion) {
      return fail("PROMOTION_NOT_FOUND", "Promotion not found", { status: 404 });
    }

    return ok(promotion);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    throw err;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "promotions.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const body = await req.json();
    const parsed = updatePromotionSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const promotion = await updatePromotionUseCase.execute({ promotionId: id, actorId: userId, ...parsed.data });
    return ok(promotion);
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
