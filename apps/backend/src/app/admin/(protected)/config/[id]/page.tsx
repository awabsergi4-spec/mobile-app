import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { remoteConfigRepository } from "@/infrastructure/remote-config/remote-config-services";
import { updateConfigEntryAction, deleteConfigEntryAction } from "../actions";

export default async function RemoteConfigEntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminPermission("config.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="config.manage" />;
    }
    throw err;
  }

  const { id } = await params;
  const entry = await remoteConfigRepository.findById(id);

  if (!entry) {
    return (
      <div>
        <Link href="/admin/config" className="text-sm text-primary hover:underline">
          ← Back to remote config
        </Link>
        <p className="mt-4 text-text-secondary">Config entry not found.</p>
      </div>
    );
  }

  const boundUpdate = updateConfigEntryAction.bind(null, entry.id);
  const boundDelete = deleteConfigEntryAction.bind(null, entry.id);
  const valueString = typeof entry.value === "string" ? entry.value : JSON.stringify(entry.value);

  return (
    <div>
      <Link href="/admin/config" className="text-sm text-primary hover:underline">
        ← Back to remote config
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">{entry.key}</h1>
        <form action={boundDelete}>
          <button type="submit" className="rounded-button bg-error px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Delete
          </button>
        </form>
      </div>
      <p className="mt-1 text-sm text-text-secondary">{entry.regionId ? "Region-scoped" : "Global default"}</p>

      <form action={boundUpdate} className="mt-6 max-w-xl space-y-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <div>
          <label htmlFor="valueType" className="block text-xs font-medium text-text-secondary">
            Value type
          </label>
          <select
            id="valueType"
            name="valueType"
            defaultValue={entry.valueType}
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          >
            <option value="BOOLEAN">Boolean</option>
            <option value="NUMBER">Number</option>
            <option value="STRING">String</option>
            <option value="JSON">JSON</option>
          </select>
        </div>
        <div>
          <label htmlFor="value" className="block text-xs font-medium text-text-secondary">
            Value
          </label>
          <input
            id="value"
            name="value"
            required
            defaultValue={valueString}
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-xs font-medium text-text-secondary">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={entry.description ?? ""}
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          Save changes
        </button>
      </form>
    </div>
  );
}
