import { NextRequest } from "next/server";
import { setAiFeatureToggleSchema } from "@sahl/shared/schemas/ai-feature-toggle.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { setAiFeatureToggleUseCase } from "@/infrastructure/ai/ai-feature-toggle-services";
import { ok, fail } from "@/presentation/http-response";
import type { AiCapability } from "@prisma/client";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ capability: string }> }) {
  try {
    const { userId } = await requirePermission(req, "ai.manage", tokenService, staffPermissionRepository);
    const { capability } = await params;

    const body = await req.json();
    const parsed = setAiFeatureToggleSchema.safeParse({ ...body, capability });
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const toggle = await setAiFeatureToggleUseCase.execute({ ...parsed.data, capability: parsed.data.capability as AiCapability, actorId: userId });
    return ok(toggle);
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
