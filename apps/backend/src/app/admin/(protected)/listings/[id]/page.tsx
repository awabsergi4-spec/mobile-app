import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { adminApi, SahlApiError } from "@/presentation/sahl-api";
import { approveListingAction, rejectListingAction } from "../actions";
import { getI18n } from "@/presentation/i18n";
import { LISTING_STATUS_KEYS, type AdminListing } from "../api";

export default async function AdminListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { t, number } = await getI18n();
  try {
    await requireAdminPermission("services.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="services.manage" />;
    }
    throw err;
  }

  const { id } = await params;
  const { error } = await searchParams;
  let listing: AdminListing | null = null;
  try {
    listing = await adminApi<AdminListing>(`/admin/listings/${id}`);
  } catch (err) {
    if (!(err instanceof SahlApiError && err.status === 404)) throw err;
  }

  if (!listing) {
    return (
      <div>
        <Link href="/admin/listings" className="text-sm text-primary hover:underline">
          {t("listings.back")}
        </Link>
        <p className="mt-4 text-text-secondary">{t("listings.notFound")}</p>
      </div>
    );
  }

  const boundApprove = approveListingAction.bind(null, listing.id);
  const boundReject = rejectListingAction.bind(null, listing.id);
  const canApprove = listing.status === "PENDING_REVIEW";
  const canReject = listing.status !== "REJECTED";

  return (
    <div className="max-w-4xl">
      <Link href="/admin/listings" className="text-sm text-primary hover:underline">
        {t("listings.back")}
      </Link>

      <div className="mt-4 overflow-hidden rounded-card border border-text-disabled/20 bg-surface-light">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={listing.coverUrl} alt={t("listings.cover")} className="aspect-video w-full object-cover" />
        <div className="p-6">
          <p className="text-xs font-medium uppercase text-text-secondary">{t(LISTING_STATUS_KEYS[listing.status])}</p>
          <h1 className="mt-1 text-xl font-semibold text-text-primary">{listing.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {listing.provider ? (
              <Link href={`/admin/providers/${listing.provider.id}`} className="text-primary hover:underline">
                {listing.provider.businessName}
              </Link>
            ) : (
              "—"
            )}{" "}
            · {listing.category?.name ?? "—"} · {t("listings.priceFrom", { price: number(listing.priceFrom) })}
            {listing.deliveryDays ? ` · ${t("listings.delivery", { days: listing.deliveryDays })}` : ""}
          </p>
          {listing.rejectionReason && (
            <p className="mt-3 rounded-button border border-error/40 bg-error/10 px-3 py-2 text-sm text-text-primary">
              {t("listings.lastRejection", { reason: listing.rejectionReason })}
            </p>
          )}
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-text-primary">{listing.description}</p>
        </div>
      </div>

      {listing.images && listing.images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {listing.images.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-button border border-text-disabled/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={t("listings.gallery")} className="aspect-video w-full object-cover" />
            </a>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-button border border-error/40 bg-error/10 px-4 py-3 text-sm text-text-primary">{t("listings.reasonRequired")}</p>
      )}

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">{t("listings.review")}</h2>
        {canApprove && (
          <form action={boundApprove} className="mt-3">
            <button type="submit" className="rounded-button bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              {t("listings.approve")}
            </button>
          </form>
        )}
        {canReject ? (
          <form action={boundReject} className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="reason" className="block text-xs font-medium text-text-secondary">
                {t("listings.reason")}
              </label>
              <input
                id="reason"
                name="reason"
                required
                minLength={3}
                maxLength={500}
                placeholder={t("listings.reasonPlaceholder")}
                className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
              />
            </div>
            <button type="submit" className="rounded-button bg-error px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              {listing.status === "PENDING_REVIEW" ? t("listings.reject") : t("listings.takeDown")}
            </button>
          </form>
        ) : (
          <p className="mt-2 text-sm text-text-secondary">{t("listings.rejectedNote")}</p>
        )}
      </div>
    </div>
  );
}
