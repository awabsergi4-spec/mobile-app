import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { adminApi } from "@/presentation/sahl-api";
import { LISTING_STATUS_LABELS, type AdminListingQueue, type ListingStatus } from "./api";

const STATUSES = Object.keys(LISTING_STATUS_LABELS) as ListingStatus[];

// Data comes from the SAHL API (GET /api/v1/admin/listings).
export default async function AdminListingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  try {
    await requireAdminPermission("services.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="services.manage" />;
    }
    throw err;
  }

  const { status = "PENDING_REVIEW" } = await searchParams;
  const { listings, pendingCount } = await adminApi<AdminListingQueue>(`/admin/listings?status=${status}`);

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary">Service listings</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Services providers post. New and edited listings stay hidden from customers until approved.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/listings?status=${s}`}
            className={`rounded-button border px-3 py-1.5 ${
              status === s ? "border-primary bg-primary/10 font-semibold text-primary" : "border-text-disabled/30 text-text-secondary"
            }`}
          >
            {LISTING_STATUS_LABELS[s]}
            {s === "PENDING_REVIEW" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="mt-4 rounded-card border border-text-disabled/20 bg-surface-light">
          <EmptyState message="Nothing here." />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/admin/listings/${l.id}`}
              className="overflow-hidden rounded-card border border-text-disabled/20 bg-surface-light hover:border-primary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.coverUrl} alt="" className="aspect-video w-full object-cover" />
              <div className="p-4">
                <p className="line-clamp-2 font-medium text-text-primary">{l.title}</p>
                <p className="mt-1 text-xs text-text-secondary">
                  {l.provider?.businessName ?? "—"} · {l.category?.name ?? "—"}
                </p>
                <p className="mt-2 text-sm text-text-primary">From {l.priceFrom.toLocaleString()}</p>
                <p className="mt-1 text-xs text-text-secondary">Updated {new Date(l.updatedAt).toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
