import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { markAllNotificationsReadUseCase } from "@/infrastructure/notification/notification-services";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const updatedCount = await markAllNotificationsReadUseCase.execute(userId);
    return ok({ updatedCount });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
