import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { workflowDefinitionRepository } from "@/infrastructure/workflow/workflow-admin-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(req, "workflows.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const definition = await workflowDefinitionRepository.findById(id);
    if (!definition) {
      return fail("WORKFLOW_DEFINITION_NOT_FOUND", "Workflow definition not found", { status: 404 });
    }

    return ok(definition);
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
