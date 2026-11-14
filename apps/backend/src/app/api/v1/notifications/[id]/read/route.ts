import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { markNotificationReadUseCase } from "@/infrastructure/notification/notification-services";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    // markRead's underlying updateMany is scoped to (id, userId) — marking
    // another user's notification read is a silent no-op, not an error,
    // avoiding an existence-leak side channel.
    await markNotificationReadUseCase.execute(id, userId);
    return ok({ success: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
