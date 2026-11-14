import type { RemoteConfigValueType } from "@/domain/remote-config/remote-config.entity";
import { InvalidRemoteConfigValueError } from "./errors";

// Validated at the application layer on every write, per the schema
// comment on RemoteConfigEntry.value — the column itself is untyped Json.
export function assertValueMatchesType(valueType: RemoteConfigValueType, value: unknown): void {
  const valid =
    (valueType === "BOOLEAN" && typeof value === "boolean") ||
    (valueType === "NUMBER" && typeof value === "number" && Number.isFinite(value)) ||
    (valueType === "STRING" && typeof value === "string") ||
    (valueType === "JSON" && typeof value === "object" && value !== null);

  if (!valid) {
    throw new InvalidRemoteConfigValueError(valueType);
  }
}
