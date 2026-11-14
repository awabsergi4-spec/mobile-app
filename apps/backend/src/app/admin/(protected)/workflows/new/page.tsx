import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { createWorkflowDefinitionAction } from "../actions";

const EXAMPLE_STEPS = JSON.stringify(
  [
    {
      stepKey: "release-funds",
      order: 0,
      actionType: "RELEASE_ESCROW",
      actionConfig: {},
      maxRetries: 2,
    },
  ],
  null,
  2,
);

export default async function NewWorkflowDefinitionPage() {
  try {
    await requireAdminPermission("workflows.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="workflows.manage" />;
    }
    throw err;
  }

  return (
    <div>
      <Link href="/admin/workflows" className="text-sm text-primary hover:underline">
        ← Back to workflows
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">New workflow definition</h1>

      <form
        action={createWorkflowDefinitionAction}
        className="mt-4 max-w-2xl space-y-4 rounded-card border border-text-disabled/20 bg-surface-light p-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="key" className="block text-xs font-medium text-text-secondary">
              Key
            </label>
            <input
              id="key"
              name="key"
              required
              placeholder="e.g. milestone-completion"
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-text-secondary">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="triggerEventType" className="block text-xs font-medium text-text-secondary">
              Trigger event type
            </label>
            <input
              id="triggerEventType"
              name="triggerEventType"
              required
              placeholder="a DomainEvent.type value"
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label htmlFor="priority" className="block text-xs font-medium text-text-secondary">
              Priority
            </label>
            <input
              id="priority"
              name="priority"
              type="number"
              defaultValue={0}
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </div>
        <div>
          <label htmlFor="steps" className="block text-xs font-medium text-text-secondary">
            Steps (JSON array — stepKey, order, actionType, actionConfig required per step)
          </label>
          <textarea
            id="steps"
            name="steps"
            required
            rows={12}
            defaultValue={EXAMPLE_STEPS}
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 font-mono text-xs text-text-primary"
          />
        </div>
        <p className="text-xs text-text-secondary">Created as a draft — activate it from the detail page once reviewed.</p>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          Create workflow definition
        </button>
      </form>
    </div>
  );
}
