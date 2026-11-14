import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { sendNotificationBroadcastUseCase } from "@/infrastructure/notification/notification-services";
import { NotificationBroadcastAlreadySentError, NotificationBroadcastNotFoundError } from "@/application/notification/errors";
import { UnsupportedTargetingRuleError } from "@/infrastructure/notification/notification-target-resolver";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "notifications.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const result = await sendNotificationBroadcastUseCase.execute({ broadcastId: id, actorId: userId });
    return ok(result);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof NotificationBroadcastNotFoundError) {
      return fail("BROADCAST_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof NotificationBroadcastAlreadySentError) {
      return fail("BROADCAST_ALREADY_SENT", err.message, { status: 409 });
    }
    if (err instanceof UnsupportedTargetingRuleError) {
      return fail("UNSUPPORTED_TARGETING_RULE", err.message, { status: 422 });
    }
    throw err;
  }
}
