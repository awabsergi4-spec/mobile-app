import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { aiFeatureToggleRepository } from "@/infrastructure/ai/ai-feature-toggle-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "ai.manage", tokenService, staffPermissionRepository);

    const toggles = await aiFeatureToggleRepository.listAll();
    return ok(toggles);
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
