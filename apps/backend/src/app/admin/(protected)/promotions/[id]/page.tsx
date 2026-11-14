import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { promotionRepository } from "@/infrastructure/promotion/promotion-services";
import { updatePromotionAction, setPromotionActiveAction } from "../actions";

function toLocalInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function PromotionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminPermission("promotions.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="promotions.manage" />;
    }
    throw err;
  }

  const { id } = await params;
  const promotion = await promotionRepository.findById(id);

  if (!promotion) {
    return (
      <div>
        <Link href="/admin/promotions" className="text-sm text-primary hover:underline">
          ← Back to promotions
        </Link>
        <p className="mt-4 text-text-secondary">Promotion not found.</p>
      </div>
    );
  }

  const boundUpdate = updatePromotionAction.bind(null, promotion.id);
  const boundActivate = setPromotionActiveAction.bind(null, promotion.id, true);
  const boundDeactivate = setPromotionActiveAction.bind(null, promotion.id, false);

  return (
    <div>
      <Link href="/admin/promotions" className="text-sm text-primary hover:underline">
        ← Back to promotions
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">{promotion.name}</h1>
        {promotion.isActive ? (
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

      <form action={boundUpdate} className="mt-6 max-w-xl space-y-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-text-secondary">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={promotion.name}
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
            defaultValue={promotion.description ?? ""}
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="discountType" className="block text-xs font-medium text-text-secondary">
              Discount type
            </label>
            <select
              id="discountType"
              name="discountType"
              defaultValue={promotion.discountType}
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FLAT">Flat (minor currency units)</option>
            </select>
          </div>
          <div>
            <label htmlFor="discountValue" className="block text-xs font-medium text-text-secondary">
              Discount value
            </label>
            <input
              id="discountValue"
              name="discountValue"
              type="number"
              min={1}
              required
              defaultValue={promotion.discountValue}
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startsAt" className="block text-xs font-medium text-text-secondary">
              Starts
            </label>
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={toLocalInputValue(promotion.startsAt)}
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
              defaultValue={toLocalInputValue(promotion.endsAt)}
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
