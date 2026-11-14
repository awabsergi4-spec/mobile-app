import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { promotionRepository } from "@/infrastructure/promotion/promotion-services";

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ isActive?: string }>;
}) {
  try {
    await requireAdminPermission("promotions.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="promotions.manage" />;
    }
    throw err;
  }

  const { isActive } = await searchParams;
  const promotions = await promotionRepository.search({
    isActive: isActive === undefined ? undefined : isActive === "true",
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Promotions</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {promotions.length} campaign{promotions.length === 1 ? "" : "s"} shown. Configurable content — no app update required to
            change.
          </p>
        </div>
        <Link href="/admin/promotions/new" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          New promotion
        </Link>
      </div>

      <form className="mt-4 flex gap-3" method="GET">
        <select
          name="isActive"
          defaultValue={isActive ?? ""}
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          Filter
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {promotions.length === 0 ? (
          <EmptyState message="No promotions match this filter." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.id} className="border-b border-text-disabled/10 last:border-0 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/promotions/${promo.id}`} className="font-medium text-text-primary hover:text-primary">
                      {promo.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}%` : `${promo.discountValue} (minor units)`}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {promo.startsAt.toLocaleDateString()} – {promo.endsAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={promo.isActive ? "text-success" : "text-text-secondary"}>{promo.isActive ? "Active" : "Inactive"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
