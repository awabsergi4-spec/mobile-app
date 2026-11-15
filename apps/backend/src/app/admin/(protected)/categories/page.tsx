import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { adminApi } from "@/presentation/sahl-api";
import { createCategoryAction } from "./actions";
import { CATEGORY_TYPE_LABELS, CATEGORY_TYPES, type AdminCategory } from "./api";

const inputClass =
  "mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary";

// Data comes from the SAHL API (GET /api/v1/admin/service-categories).
export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; error?: string; created?: string }>;
}) {
  try {
    await requireAdminPermission("services.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="services.manage" />;
    }
    throw err;
  }

  const { type, error, created } = await searchParams;
  const categories = await adminApi<AdminCategory[]>(`/admin/service-categories${type ? `?type=${type}` : ""}`);

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary">Service categories</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Categories customers browse in the app. Names are shown in the customer&apos;s language. Hide a category instead of
        deleting it.
      </p>

      {error && (
        <p className="mt-4 rounded-button border border-error/40 bg-error/10 px-4 py-3 text-sm text-text-primary">{error}</p>
      )}
      {created && (
        <p className="mt-4 rounded-button border border-success/40 bg-success/10 px-4 py-3 text-sm text-text-primary">
          Created “{created}”.
        </p>
      )}

      <form action={createCategoryAction} className="mt-4 rounded-card border border-text-disabled/20 bg-surface-light p-5">
        <h2 className="text-sm font-semibold text-text-primary">New category</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-xs font-medium text-text-secondary">
            Type
            <select name="type" required defaultValue="REMOTE" className={inputClass}>
              {CATEGORY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CATEGORY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-text-secondary">
            Name (English)
            <input name="nameEn" required minLength={2} maxLength={80} placeholder="Video Editing" className={inputClass} />
          </label>
          <label className="text-xs font-medium text-text-secondary">
            Name (Arabic)
            <input name="nameAr" required minLength={2} maxLength={80} dir="rtl" placeholder="مونتاج فيديو" className={inputClass} />
          </label>
          <label className="text-xs font-medium text-text-secondary md:col-span-3 md:grid md:grid-cols-2 md:gap-4">
            <span>
              Description (English, optional)
              <input name="descriptionEn" maxLength={500} className={inputClass} />
            </span>
            <span>
              Description (Arabic, optional)
              <input name="descriptionAr" maxLength={500} dir="rtl" className={inputClass} />
            </span>
          </label>
        </div>
        <p className="mt-3 text-xs text-text-secondary">
          The app picks the category picture from the English name (e.g. “Voice Over”, “Writing”, “Video Editing”).
        </p>
        <button type="submit" className="mt-3 rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          Create category
        </button>
      </form>

      <div className="mt-6 flex gap-2 text-sm">
        <Link href="/admin/categories" className={!type ? "font-semibold text-primary" : "text-text-secondary hover:text-primary"}>
          All
        </Link>
        {CATEGORY_TYPES.map((t) => (
          <Link
            key={t}
            href={`/admin/categories?type=${t}`}
            className={type === t ? "font-semibold text-primary" : "text-text-secondary hover:text-primary"}
          >
            · {CATEGORY_TYPE_LABELS[t]}
          </Link>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {categories.length === 0 ? (
          <EmptyState message="No categories yet." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">English</th>
                <th className="px-4 py-3">Arabic</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Providers</th>
                <th className="px-4 py-3">Listings</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-text-disabled/10 last:border-0 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/categories/${c.id}`} className="font-medium text-text-primary hover:text-primary">
                      {c.nameEn ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary" dir="rtl">
                    {c.nameAr ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{CATEGORY_TYPE_LABELS[c.type]}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.providerCount}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.listingCount}</td>
                  <td className="px-4 py-3">
                    <span className={c.isActive ? "text-success" : "text-text-secondary"}>{c.isActive ? "Visible" : "Hidden"}</span>
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
