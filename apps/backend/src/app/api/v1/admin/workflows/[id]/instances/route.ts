import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { workflowInstanceRepository } from "@/infrastructure/workflow/workflow-admin-services";
import { ok, fail } from "@/presentation/http-response";
import type { WorkflowInstanceStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(req, "workflows.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const status = req.nextUrl.searchParams.get("status") as WorkflowInstanceStatus | null;

    const instances = await workflowInstanceRepository.search({ workflowDefinitionId: id, status: status ?? undefined });
    return ok(instances);
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
