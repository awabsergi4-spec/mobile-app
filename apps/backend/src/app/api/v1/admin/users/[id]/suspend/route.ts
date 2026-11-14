import { NextRequest } from "next/server";
import { suspendUserSchema } from "@sahl/shared/schemas/admin.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository, suspendUserUseCase } from "@/infrastructure/identity/auth-services";
import { UserNotFoundError } from "@/application/identity/errors";
import { InvalidUserStatusTransitionError } from "@/application/identity/suspend-user.use-case";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "users.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const body = await req.json();
    const parsed = suspendUserSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    await suspendUserUseCase.execute({ userId: id, reason: parsed.data.reason, actorId: userId });
    return ok({ status: "SUSPENDED" });
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
