import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { adminApi } from "@/presentation/sahl-api";
import { getI18n } from "@/presentation/i18n";
import { LISTING_STATUS_KEYS, LISTING_STATUSES, type AdminListingQueue } from "./api";

// Data comes from the SAHL API (GET /api/v1/admin/listings).
export default async function AdminListingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { t, number, dateTime } = await getI18n();
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
      <h1 className="text-xl font-semibold text-text-primary">{t("listings.title")}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {t("listings.subtitle")}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {LISTING_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/listings?status=${s}`}
            className={`rounded-button border px-3 py-1.5 ${
              status === s ? "border-primary bg-primary/10 font-semibold text-primary" : "border-text-disabled/30 text-text-secondary"
            }`}
          >
            {t(LISTING_STATUS_KEYS[s])}
            {s === "PENDING_REVIEW" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="mt-4 rounded-card border border-text-disabled/20 bg-surface-light">
          <EmptyState message={t("listings.empty")} />
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
                <p className="mt-2 text-sm text-text-primary">{t("listings.priceFrom", { price: number(l.priceFrom) })}</p>
                <p className="mt-1 text-xs text-text-secondary">{t("listings.updated", { when: dateTime(l.updatedAt) })}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
