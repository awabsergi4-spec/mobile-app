import { NextRequest } from "next/server";
import { createAdvertisementSchema } from "@sahl/shared/schemas/advertisement.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { advertisementRepository, createAdvertisementUseCase } from "@/infrastructure/advertisement/advertisement-services";
import { ok, fail } from "@/presentation/http-response";
import type { AdPlacement } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "advertisements.manage", tokenService, staffPermissionRepository);

    const placement = req.nextUrl.searchParams.get("placement") as AdPlacement | null;
    const isActiveParam = req.nextUrl.searchParams.get("isActive");

    const ads = await advertisementRepository.search({
      placement: placement ?? undefined,
      isActive: isActiveParam === null ? undefined : isActiveParam === "true",
    });

    return ok(ads);
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
    const { userId } = await requirePermission(req, "advertisements.manage", tokenService, staffPermissionRepository);

    const body = await req.json();
    const parsed = createAdvertisementSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const ad = await createAdvertisementUseCase.execute({ ...parsed.data, actorId: userId });
    return ok(ad, { status: 201 });
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
