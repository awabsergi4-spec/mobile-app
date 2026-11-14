import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { notificationBroadcastRepository } from "@/infrastructure/notification/notification-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(req, "notifications.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const broadcast = await notificationBroadcastRepository.findById(id);
    if (!broadcast) {
      return fail("BROADCAST_NOT_FOUND", "Notification broadcast not found", { status: 404 });
    }

    return ok(broadcast);
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
