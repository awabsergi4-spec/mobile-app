import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { StatCard } from "@/presentation/admin-ui/stat-card";
import { advertisementRepository } from "@/infrastructure/advertisement/advertisement-services";
import { updateAdvertisementAction, setAdvertisementActiveAction } from "../actions";

function toLocalInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function AdvertisementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminPermission("advertisements.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="advertisements.manage" />;
    }
    throw err;
  }

  const { id } = await params;
  const ad = await advertisementRepository.findById(id);

  if (!ad) {
    return (
      <div>
        <Link href="/admin/advertisements" className="text-sm text-primary hover:underline">
          ← Back to advertisements
        </Link>
        <p className="mt-4 text-text-secondary">Advertisement not found.</p>
      </div>
    );
  }

  const eventCounts = await advertisementRepository.getEventCounts(id);
  const boundUpdate = updateAdvertisementAction.bind(null, ad.id);
  const boundActivate = setAdvertisementActiveAction.bind(null, ad.id, true);
  const boundDeactivate = setAdvertisementActiveAction.bind(null, ad.id, false);

  return (
    <div>
      <Link href="/admin/advertisements" className="text-sm text-primary hover:underline">
        ← Back to advertisements
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">{ad.title || "(untitled)"}</h1>
        {ad.isActive ? (
          <form action={boundDeactivate}>
            <button type="submit" className="rounded-button bg-error px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Deactivate
            </button>
          </form>
        ) : (
          <form action={boundActivate}>
            <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
              Activate
            </button>
          </form>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <StatCard label="Impressions" value={eventCounts.impressions.toLocaleString()} />
        <StatCard label="Clicks" value={eventCounts.clicks.toLocaleString()} />
        <StatCard label="Conversions" value={eventCounts.conversions.toLocaleString()} />
      </div>

      <form action={boundUpdate} className="mt-6 max-w-xl space-y-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <div>
          <label htmlFor="title" className="block text-xs font-medium text-text-secondary">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={ad.title}
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
            defaultValue={ad.description ?? ""}
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
              defaultValue={ad.adType}
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
              defaultValue={ad.placement}
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
            defaultValue={ad.creativeUrl ?? ""}
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
              defaultValue={ad.ctaText ?? ""}
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
              defaultValue={ad.destinationUrl ?? ""}
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
              defaultValue={ad.priority}
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
              defaultValue={toLocalInputValue(ad.startsAt)}
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
              defaultValue={toLocalInputValue(ad.endsAt)}
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </div>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          Save changes
        </button>
      </form>
    </div>
  );
}
