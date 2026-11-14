import { NextRequest } from "next/server";
import { createOnDemandRequestSchema } from "@sahl/shared/schemas/on-demand.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { createOnDemandRequestUseCase, onDemandRequestRepository } from "@/infrastructure/on-demand/on-demand-services";
import { ok, fail } from "@/presentation/http-response";
import type { OnDemandStatus } from "@prisma/client";

// The signed-in customer's own request history — never a broad admin-style
// search (see the comment on OnDemandRequestRepository.search).
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const status = req.nextUrl.searchParams.get("status") as OnDemandStatus | null;
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

    const requests = await onDemandRequestRepository.listByCustomerId(userId, { status: status ?? undefined, cursor });
    return ok(requests);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const body = await req.json();
    const parsed = createOnDemandRequestSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const request = await createOnDemandRequestUseCase.execute({ customerId: userId, ...parsed.data });
    return ok(request, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
