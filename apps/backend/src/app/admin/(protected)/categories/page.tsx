import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { getI18n } from "@/presentation/i18n";
import { adminApi } from "@/presentation/sahl-api";
import { createCategoryAction } from "./actions";
import { CATEGORY_ERROR_KEYS, CATEGORY_TYPE_KEYS, CATEGORY_TYPES, type AdminCategory } from "./api";
import { CategoryImageField } from "./image-field";
import { categoryImagePreview, uploadsEnabled } from "./upload";

const inputClass =
  "mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary";

// Data comes from the SAHL API (GET /api/v1/admin/service-categories).
export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; error?: string; created?: string }>;
}) {
  const { t, locale, number } = await getI18n();
  try {
    await requireAdminPermission("services.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="services.manage" />;
    }
    throw err;
  }

  const { type, error, created } = await searchParams;
  const [categories, canUpload] = await Promise.all([
    adminApi<AdminCategory[]>(`/admin/service-categories${type ? `?type=${type}` : ""}`),
    uploadsEnabled(),
  ]);
  const name = (c: AdminCategory) => (locale === "ar" ? c.nameAr ?? c.nameEn : c.nameEn ?? c.nameAr) ?? "—";
  const createdCategory = created ? categories.find((c) => c.id === created) : undefined;

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary">{t("categories.title")}</h1>
      <p className="mt-1 text-sm text-text-secondary">{t("categories.subtitle")}</p>

      {error && (
        <p className="mt-4 rounded-button border border-error/40 bg-error/10 px-4 py-3 text-sm text-text-primary">
          {t(CATEGORY_ERROR_KEYS[error] ?? "categories.error.generic")}
        </p>
      )}
      {created && (
        <p className="mt-4 rounded-button border border-success/40 bg-success/10 px-4 py-3 text-sm text-text-primary">
          {t("categories.created", { name: createdCategory ? name(createdCategory) : "" })}
        </p>
      )}

      <form action={createCategoryAction} className="mt-4 rounded-card border border-text-disabled/20 bg-surface-light p-5">
        <h2 className="text-sm font-semibold text-text-primary">{t("categories.new")}</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-xs font-medium text-text-secondary">
            {t("categories.type")}
            <select name="type" required defaultValue="REMOTE" className={inputClass}>
              {CATEGORY_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {t(CATEGORY_TYPE_KEYS[ct])}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-text-secondary">
            {t("categories.nameEn")}
            <input name="nameEn" required minLength={2} maxLength={80} dir="ltr" placeholder="Video Editing" className={inputClass} />
          </label>
          <label className="text-xs font-medium text-text-secondary">
            {t("categories.nameAr")}
            <input name="nameAr" required minLength={2} maxLength={80} dir="rtl" placeholder="مونتاج فيديو" className={inputClass} />
          </label>
          <label className="text-xs font-medium text-text-secondary">
            {t("categories.descriptionEn")}
            <input name="descriptionEn" maxLength={500} dir="ltr" className={inputClass} />
          </label>
          <label className="text-xs font-medium text-text-secondary">
            {t("categories.descriptionAr")}
            <input name="descriptionAr" maxLength={500} dir="rtl" className={inputClass} />
          </label>
          <CategoryImageField t={t} enabled={canUpload} />
        </div>
        <p className="mt-3 text-xs text-text-secondary">{t("categories.keyHint")}</p>
        <button type="submit" className="mt-3 rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("categories.create")}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/categories" className={!type ? "font-semibold text-primary" : "text-text-secondary hover:text-primary"}>
          {t("categories.all")}
        </Link>
        {CATEGORY_TYPES.map((ct) => (
          <Link
            key={ct}
            href={`/admin/categories?type=${ct}`}
            className={type === ct ? "font-semibold text-primary" : "text-text-secondary hover:text-primary"}
          >
            {t(CATEGORY_TYPE_KEYS[ct])}
          </Link>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {categories.length === 0 ? (
          <EmptyState message={t("categories.empty")} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t("categories.image")}</th>
                <th className="px-4 py-3">{t("categories.nameEn")}</th>
                <th className="px-4 py-3">{t("categories.nameAr")}</th>
                <th className="px-4 py-3">{t("categories.type")}</th>
                <th className="px-4 py-3">{t("categories.providers")}</th>
                <th className="px-4 py-3">{t("categories.listings")}</th>
                <th className="px-4 py-3">{t("categories.status")}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-text-disabled/10 last:border-0 hover:bg-primary/5">
                  <td className="px-4 py-2">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={categoryImagePreview(c.imageUrl, 160)} alt="" className="aspect-video w-20 rounded-button object-cover" />
                    ) : (
                      <span className="text-xs text-text-secondary">{t("categories.builtIn")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    <Link href={`/admin/categories/${c.id}`} className="font-medium text-text-primary hover:text-primary">
                      {c.nameEn ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3" dir="rtl">
                    <Link href={`/admin/categories/${c.id}`} className="text-text-primary hover:text-primary">
                      {c.nameAr ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{t(CATEGORY_TYPE_KEYS[c.type])}</td>
                  <td className="px-4 py-3 text-text-secondary">{number(c.providerCount)}</td>
                  <td className="px-4 py-3 text-text-secondary">{number(c.listingCount)}</td>
                  <td className="px-4 py-3">
                    <span className={c.isActive ? "text-success" : "text-text-secondary"}>
                      {c.isActive ? t("categories.visible") : t("categories.hidden")}
                    </span>
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
