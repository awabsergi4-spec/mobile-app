import { NextRequest } from "next/server";
import { updateAdvertisementSchema } from "@sahl/shared/schemas/advertisement.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { advertisementRepository, updateAdvertisementUseCase } from "@/infrastructure/advertisement/advertisement-services";
import { AdvertisementNotFoundError } from "@/application/advertisement/errors";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(req, "advertisements.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const ad = await advertisementRepository.findById(id);
    if (!ad) {
      return fail("ADVERTISEMENT_NOT_FOUND", "Advertisement not found", { status: 404 });
    }
    const eventCounts = await advertisementRepository.getEventCounts(id);

    return ok({ ...ad, eventCounts });
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
    const { userId } = await requirePermission(req, "advertisements.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const body = await req.json();
    const parsed = updateAdvertisementSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const ad = await updateAdvertisementUseCase.execute({ advertisementId: id, actorId: userId, ...parsed.data });
    return ok(ad);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof AdvertisementNotFoundError) {
      return fail("ADVERTISEMENT_NOT_FOUND", err.message, { status: 404 });
    }
    throw err;
  }
}
