import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { setWorkflowDefinitionStatusUseCase } from "@/infrastructure/workflow/workflow-admin-services";
import { WorkflowDefinitionNotFoundError } from "@/application/workflow/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "workflows.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    await setWorkflowDefinitionStatusUseCase.execute({ workflowDefinitionId: id, status: "PUBLISHED", actorId: userId });
    return ok({ status: "PUBLISHED" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof WorkflowDefinitionNotFoundError) {
      return fail("WORKFLOW_DEFINITION_NOT_FOUND", err.message, { status: 404 });
    }
    throw err;
  }
}
