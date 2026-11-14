import { NextRequest } from "next/server";
import { remoteConfigRepository } from "@/infrastructure/remote-config/remote-config-services";
import { ok } from "@/presentation/http-response";

// Public, unauthenticated — the app needs config (maintenance mode,
// min_supported_version, etc.) before a user is signed in. A region-scoped
// row overrides the global row for the same key; keyed by `key` for
// direct client lookup, real DB data only, no hardcoded defaults.
export async function GET(req: NextRequest) {
  const regionId = req.nextUrl.searchParams.get("regionId");

  const entries = await remoteConfigRepository.resolveForRegion(regionId);
  const config = Object.fromEntries(
    entries.map((entry) => [entry.key, { value: entry.value, valueType: entry.valueType }]),
  );

  return ok(config);
}
