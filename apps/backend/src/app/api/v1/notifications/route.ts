import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { notificationRepository } from "@/infrastructure/notification/notification-services";
import { ok, fail } from "@/presentation/http-response";

// The signed-in user's own persistent in-app inbox — real Notification
// rows only, works with no Firebase/push provider configured.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const unreadOnly = req.nextUrl.searchParams.get("unreadOnly") === "true";
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const notifications = await notificationRepository.listForUser(userId, { unreadOnly, cursor, limit });
    return ok(notifications);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
