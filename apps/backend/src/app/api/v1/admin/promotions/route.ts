import { NextRequest } from "next/server";
import { createPromotionSchema } from "@sahl/shared/schemas/promotion.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { promotionRepository, createPromotionUseCase } from "@/infrastructure/promotion/promotion-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "promotions.manage", tokenService, staffPermissionRepository);

    const isActiveParam = req.nextUrl.searchParams.get("isActive");

    const promotions = await promotionRepository.search({
      isActive: isActiveParam === null ? undefined : isActiveParam === "true",
    });

    return ok(promotions);
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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requirePermission(req, "promotions.manage", tokenService, staffPermissionRepository);

    const body = await req.json();
    const parsed = createPromotionSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const promotion = await createPromotionUseCase.execute({ ...parsed.data, actorId: userId });
    return ok(promotion, { status: 201 });
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
