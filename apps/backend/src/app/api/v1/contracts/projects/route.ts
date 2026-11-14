import { NextRequest } from "next/server";
import { createContractProjectSchema } from "@sahl/shared/schemas/contract.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { createContractProjectUseCase, contractProjectRepository } from "@/infrastructure/contract/contract-services";
import { ok, fail } from "@/presentation/http-response";

// `mine=true` -> the caller's own posted projects (customer's "My
// Projects"). Otherwise -> the public OPEN_FOR_BIDS marketplace browse
// providers need to find work — guest-browsable in spirit like the
// project-detail route, but kept behind requireAuth here since it's the
// list surface, not the single-item preview.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const mine = req.nextUrl.searchParams.get("mine") === "true";
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

    const projects = mine
      ? await contractProjectRepository.listByCustomerId(userId, { cursor })
      : await contractProjectRepository.search({ status: "OPEN_FOR_BIDS", cursor });

    return ok(projects);
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
    const parsed = createContractProjectSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const project = await createContractProjectUseCase.execute({ customerId: userId, ...parsed.data });
    return ok(project, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
