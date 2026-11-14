import { NextRequest } from "next/server";
import { createRemoteConfigEntrySchema } from "@sahl/shared/schemas/remote-config.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { remoteConfigRepository, createRemoteConfigEntryUseCase } from "@/infrastructure/remote-config/remote-config-services";
import { InvalidRemoteConfigValueError } from "@/application/remote-config/errors";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "config.manage", tokenService, staffPermissionRepository);

    const key = req.nextUrl.searchParams.get("key") ?? undefined;

    const entries = await remoteConfigRepository.search({ key });
    return ok(entries);
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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requirePermission(req, "config.manage", tokenService, staffPermissionRepository);

    const body = await req.json();
    const parsed = createRemoteConfigEntrySchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const entry = await createRemoteConfigEntryUseCase.execute({
      key: parsed.data.key,
      valueType: parsed.data.valueType,
      value: parsed.data.value,
      regionId: parsed.data.regionId,
      targetingRules: parsed.data.targetingRules,
      description: parsed.data.description,
      updatedById: userId,
      actorId: userId,
    });
    return ok(entry, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof InvalidRemoteConfigValueError) {
      return fail("INVALID_VALUE", err.message, { status: 422 });
    }
    throw err;
  }
}
