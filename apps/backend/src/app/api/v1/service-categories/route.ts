import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { serviceCategoryRepository } from "@/infrastructure/service-category/service-category-services";
import { ok, fail } from "@/presentation/http-response";
import type { ServiceType } from "@prisma/client";

// Public reference data every service-creation flow needs (On-Demand,
// Contract, Remote) — real DB rows + translations, never a hardcoded list.
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, tokenService);

    const type = req.nextUrl.searchParams.get("type") as ServiceType | null;
    const locale = req.nextUrl.searchParams.get("locale") ?? "en";

    const categories = await serviceCategoryRepository.listActive({ type: type ?? undefined, locale });
    return ok(categories);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
