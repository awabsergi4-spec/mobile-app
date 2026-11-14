import { NextRequest } from "next/server";
import { updateRemoteConfigEntrySchema } from "@sahl/shared/schemas/remote-config.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { remoteConfigRepository, updateRemoteConfigEntryUseCase, deleteRemoteConfigEntryUseCase } from "@/infrastructure/remote-config/remote-config-services";
import { InvalidRemoteConfigValueError, RemoteConfigEntryNotFoundError } from "@/application/remote-config/errors";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(req, "config.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const entry = await remoteConfigRepository.findById(id);
    if (!entry) {
      return fail("CONFIG_ENTRY_NOT_FOUND", "Remote config entry not found", { status: 404 });
    }

    return ok(entry);
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "config.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const body = await req.json();
    const parsed = updateRemoteConfigEntrySchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const entry = await updateRemoteConfigEntryUseCase.execute({ entryId: id, actorId: userId, updatedById: userId, ...parsed.data });
    return ok(entry);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof RemoteConfigEntryNotFoundError) {
      return fail("CONFIG_ENTRY_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidRemoteConfigValueError) {
      return fail("INVALID_VALUE", err.message, { status: 422 });
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "config.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    await deleteRemoteConfigEntryUseCase.execute(id, userId);
    return ok({ success: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof RemoteConfigEntryNotFoundError) {
      return fail("CONFIG_ENTRY_NOT_FOUND", err.message, { status: 404 });
    }
    throw err;
  }
}
