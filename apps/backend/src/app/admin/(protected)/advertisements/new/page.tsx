import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { createAdvertisementAction } from "../actions";

export default async function NewAdvertisementPage() {
  try {
    await requireAdminPermission("advertisements.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="advertisements.manage" />;
    }
    throw err;
  }

  return (
    <div>
      <Link href="/admin/advertisements" className="text-sm text-primary hover:underline">
        ← Back to advertisements
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">New advertisement</h1>

      <form action={createAdvertisementAction} className="mt-4 max-w-xl space-y-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <div>
          <label htmlFor="title" className="block text-xs font-medium text-text-secondary">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
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
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="adType" className="block text-xs font-medium text-text-secondary">
              Ad type
            </label>
            <select
              id="adType"
              name="adType"
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            >
              <option value="BANNER">Banner</option>
              <option value="NATIVE">Native</option>
              <option value="SPONSORED_PROVIDER">Sponsored provider</option>
              <option value="SPONSORED_SERVICE">Sponsored service</option>
              <option value="SPONSORED_CATEGORY">Sponsored category</option>
            </select>
          </div>
          <div>
            <label htmlFor="placement" className="block text-xs font-medium text-text-secondary">
              Placement
            </label>
            <select
              id="placement"
              name="placement"
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            >
              <option value="SEARCH_TOP">Search top</option>
              <option value="CATEGORY_BANNER">Category banner</option>
              <option value="PROVIDER_FEATURED">Provider featured</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="creativeUrl" className="block text-xs font-medium text-text-secondary">
            Creative image URL
          </label>
          <input
            id="creativeUrl"
            name="creativeUrl"
            type="url"
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ctaText" className="block text-xs font-medium text-text-secondary">
              CTA text
            </label>
            <input
              id="ctaText"
              name="ctaText"
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label htmlFor="destinationUrl" className="block text-xs font-medium text-text-secondary">
              Destination / deep link
            </label>
            <input
              id="destinationUrl"
              name="destinationUrl"
              type="url"
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
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
          <div>
            <label htmlFor="startsAt" className="block text-xs font-medium text-text-secondary">
              Starts
            </label>
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label htmlFor="endsAt" className="block text-xs font-medium text-text-secondary">
              Ends
            </label>
            <input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              required
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </div>
        <p className="text-xs text-text-secondary">Created inactive — publish it from the detail page once reviewed.</p>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          Create advertisement
        </button>
      </form>
    </div>
  );
}
