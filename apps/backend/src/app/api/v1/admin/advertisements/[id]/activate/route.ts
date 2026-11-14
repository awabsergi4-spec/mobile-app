import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { setAdvertisementActiveUseCase } from "@/infrastructure/advertisement/advertisement-services";
import { AdvertisementNotFoundError } from "@/application/advertisement/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "advertisements.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    await setAdvertisementActiveUseCase.execute({ advertisementId: id, isActive: true, actorId: userId });
    return ok({ isActive: true });
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
