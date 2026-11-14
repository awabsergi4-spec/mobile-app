import { NextRequest } from "next/server";
import { contractProjectRepository } from "@/infrastructure/contract/contract-services";
import { ok, fail } from "@/presentation/http-response";

// Open projects are Guest-browsable, same as provider search/profile-view
// (docs/04-api-modules.md §2 "Guest access") — bidding itself requires
// authentication, browsing does not.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await contractProjectRepository.findById(id);
  if (!project) {
    return fail("CONTRACT_PROJECT_NOT_FOUND", "Contract project not found", { status: 404 });
  }

  return ok(project);
}
