import { NextRequest } from "next/server";
import { recordAdEventSchema } from "@sahl/shared/schemas/advertisement.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { recordAdEventUseCase } from "@/infrastructure/advertisement/advertisement-services";
import { AdvertisementNotFoundError } from "@/application/advertisement/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const body = await req.json();
    const parsed = recordAdEventSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    await recordAdEventUseCase.execute({ advertisementId: id, type: parsed.data.type, userId });
    return ok({ recorded: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof AdvertisementNotFoundError) {
      return fail("ADVERTISEMENT_NOT_FOUND", err.message, { status: 404 });
    }
    throw err;
  }
}
