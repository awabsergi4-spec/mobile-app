import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { adminApi, SahlApiError } from "@/presentation/sahl-api";
import { setCategoryActiveAction, updateCategoryAction } from "../actions";
import { CATEGORY_TYPE_LABELS, type AdminCategory } from "../api";

const inputClass =
  "mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary";

export default async function AdminCategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  try {
    await requireAdminPermission("services.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="services.manage" />;
    }
    throw err;
  }

  const { id } = await params;
  const { error, saved } = await searchParams;
  let category: AdminCategory | null = null;
  try {
    category = await adminApi<AdminCategory>(`/admin/service-categories/${id}`);
  } catch (err) {
    if (!(err instanceof SahlApiError && err.status === 404)) throw err;
  }

  if (!category) {
    return (
      <div>
        <Link href="/admin/categories" className="text-sm text-primary hover:underline">
          ← Back to categories
        </Link>
        <p className="mt-4 text-text-secondary">Category not found.</p>
      </div>
    );
  }

  const boundUpdate = updateCategoryAction.bind(null, category.id);
  const boundToggle = setCategoryActiveAction.bind(null, category.id, !category.isActive);

  return (
    <div>
      <Link href="/admin/categories" className="text-sm text-primary hover:underline">
        ← Back to categories
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-text-primary">{category.nameEn ?? category.id}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {CATEGORY_TYPE_LABELS[category.type]} · {category.providerCount} providers · {category.listingCount} listings · picture key{" "}
        <code>{category.key ?? "—"}</code>
      </p>

      {error && (
        <p className="mt-4 rounded-button border border-error/40 bg-error/10 px-4 py-3 text-sm text-text-primary">{error}</p>
      )}
      {saved && (
        <p className="mt-4 rounded-button border border-success/40 bg-success/10 px-4 py-3 text-sm text-text-primary">Saved.</p>
      )}

      <form action={boundUpdate} className="mt-4 grid grid-cols-1 gap-4 rounded-card border border-text-disabled/20 bg-surface-light p-5 md:grid-cols-2">
        <label className="text-xs font-medium text-text-secondary">
          Name (English)
          <input name="nameEn" required minLength={2} maxLength={80} defaultValue={category.nameEn ?? ""} className={inputClass} />
        </label>
        <label className="text-xs font-medium text-text-secondary">
          Name (Arabic)
          <input name="nameAr" required minLength={2} maxLength={80} dir="rtl" defaultValue={category.nameAr ?? ""} className={inputClass} />
        </label>
        <label className="text-xs font-medium text-text-secondary">
          Description (English)
          <textarea name="descriptionEn" maxLength={500} rows={3} defaultValue={category.descriptionEn ?? ""} className={inputClass} />
        </label>
        <label className="text-xs font-medium text-text-secondary">
          Description (Arabic)
          <textarea name="descriptionAr" maxLength={500} rows={3} dir="rtl" defaultValue={category.descriptionAr ?? ""} className={inputClass} />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
            Save changes
          </button>
        </div>
      </form>

      <form action={boundToggle} className="mt-6 flex items-center justify-between gap-4 rounded-card border border-text-disabled/20 bg-surface-light p-5">
        <p className="text-sm text-text-primary">
          {category.isActive
            ? "Visible in the app. Hiding it stops new requests and listings in this category; existing ones are kept."
            : "Hidden from the app."}
        </p>
        <button
          type="submit"
          className={`whitespace-nowrap rounded-button px-4 py-2 text-sm font-medium text-white hover:opacity-90 ${
            category.isActive ? "bg-error" : "bg-success"
          }`}
        >
          {category.isActive ? "Hide category" : "Show category"}
        </button>
      </form>
    </div>
  );
}
