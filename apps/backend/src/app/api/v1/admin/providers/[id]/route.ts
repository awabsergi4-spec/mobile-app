import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { deleteProviderUseCase } from "@/infrastructure/provider/provider-services";
import { InvalidProviderLifecycleTransitionError, ProviderProfileNotFoundError } from "@/application/provider/errors";
import { ok, fail } from "@/presentation/http-response";

// Soft delete only — see DeleteProviderUseCase for why (financial/audit
// history integrity, ADR-008).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "providers.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    await deleteProviderUseCase.execute({ providerId: id, actorId: userId });
    return ok({ status: "DELETED" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof ProviderProfileNotFoundError) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidProviderLifecycleTransitionError) {
      return fail("INVALID_LIFECYCLE_TRANSITION", err.message, { status: 409 });
    }
    throw err;
  }
}
