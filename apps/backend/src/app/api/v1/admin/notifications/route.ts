import { NextRequest } from "next/server";
import { createNotificationBroadcastSchema } from "@sahl/shared/schemas/notification.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { notificationBroadcastRepository, createNotificationBroadcastUseCase } from "@/infrastructure/notification/notification-services";
import { ok, fail } from "@/presentation/http-response";
import type { PublishStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "notifications.manage", tokenService, staffPermissionRepository);

    const status = req.nextUrl.searchParams.get("status") as PublishStatus | null;

    const broadcasts = await notificationBroadcastRepository.search({ status: status ?? undefined });
    return ok(broadcasts);
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
    const { userId } = await requirePermission(req, "notifications.manage", tokenService, staffPermissionRepository);

    const body = await req.json();
    const parsed = createNotificationBroadcastSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const broadcast = await createNotificationBroadcastUseCase.execute({ ...parsed.data, createdById: userId, actorId: userId });
    return ok(broadcast, { status: 201 });
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
