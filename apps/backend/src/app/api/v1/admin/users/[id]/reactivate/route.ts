import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository, reactivateUserUseCase } from "@/infrastructure/identity/auth-services";
import { UserNotFoundError } from "@/application/identity/errors";
import { InvalidUserStatusTransitionError } from "@/application/identity/suspend-user.use-case";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "users.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    await reactivateUserUseCase.execute({ userId: id, actorId: userId });
    return ok({ status: "ACTIVE" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof UserNotFoundError) {
      return fail("USER_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidUserStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    throw err;
  }
}
