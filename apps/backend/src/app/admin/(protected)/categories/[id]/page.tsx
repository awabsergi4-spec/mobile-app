import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { getI18n } from "@/presentation/i18n";
import { adminApi, SahlApiError } from "@/presentation/sahl-api";
import { setCategoryActiveAction, updateCategoryAction } from "../actions";
import { CATEGORY_ERROR_KEYS, CATEGORY_TYPE_KEYS, type AdminCategory } from "../api";
import { CategoryImageField } from "../image-field";
import { uploadsEnabled } from "../upload";

const inputClass =
  "mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary";

export default async function AdminCategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
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
          {t("categories.back")}
        </Link>
        <p className="mt-4 text-text-secondary">{t("categories.notFound")}</p>
      </div>
    );
  }

  const canUpload = await uploadsEnabled();
  const boundUpdate = updateCategoryAction.bind(null, category.id);
  const boundToggle = setCategoryActiveAction.bind(null, category.id, !category.isActive);
  const title = (locale === "ar" ? category.nameAr ?? category.nameEn : category.nameEn ?? category.nameAr) ?? category.id;

  return (
    <div>
      <Link href="/admin/categories" className="text-sm text-primary hover:underline">
        {t("categories.back")}
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-text-primary">{title}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {t(CATEGORY_TYPE_KEYS[category.type])} ·{" "}
        {t("categories.counts", { providers: number(category.providerCount), listings: number(category.listingCount) })}
      </p>

      {error && (
        <p className="mt-4 rounded-button border border-error/40 bg-error/10 px-4 py-3 text-sm text-text-primary">
          {t(CATEGORY_ERROR_KEYS[error] ?? "categories.error.generic")}
        </p>
      )}
      {saved && (
        <p className="mt-4 rounded-button border border-success/40 bg-success/10 px-4 py-3 text-sm text-text-primary">
          {t("categories.saved")}
        </p>
      )}

      <form
        action={boundUpdate}
        className="mt-4 grid grid-cols-1 gap-4 rounded-card border border-text-disabled/20 bg-surface-light p-5 md:grid-cols-2"
      >
        <label className="text-xs font-medium text-text-secondary">
          {t("categories.nameEn")}
          <input name="nameEn" required minLength={2} maxLength={80} dir="ltr" defaultValue={category.nameEn ?? ""} className={inputClass} />
        </label>
        <label className="text-xs font-medium text-text-secondary">
          {t("categories.nameAr")}
          <input name="nameAr" required minLength={2} maxLength={80} dir="rtl" defaultValue={category.nameAr ?? ""} className={inputClass} />
        </label>
        <label className="text-xs font-medium text-text-secondary">
          {t("categories.descriptionEn")}
          <textarea name="descriptionEn" maxLength={500} rows={3} dir="ltr" defaultValue={category.descriptionEn ?? ""} className={inputClass} />
        </label>
        <label className="text-xs font-medium text-text-secondary">
          {t("categories.descriptionAr")}
          <textarea name="descriptionAr" maxLength={500} rows={3} dir="rtl" defaultValue={category.descriptionAr ?? ""} className={inputClass} />
        </label>
        <div className="md:col-span-2">
          <CategoryImageField t={t} enabled={canUpload} currentUrl={category.imageUrl} />
          {!category.imageUrl && <p className="mt-1 text-xs text-text-secondary">{t("categories.builtInHint")}</p>}
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
            {t("categories.save")}
          </button>
        </div>
      </form>

      <form
        action={boundToggle}
        className="mt-6 flex items-center justify-between gap-4 rounded-card border border-text-disabled/20 bg-surface-light p-5"
      >
        <p className="text-sm text-text-primary">{category.isActive ? t("categories.visibleNote") : t("categories.hiddenNote")}</p>
        <button
          type="submit"
          className={`whitespace-nowrap rounded-button px-4 py-2 text-sm font-medium text-white hover:opacity-90 ${
            category.isActive ? "bg-error" : "bg-success"
          }`}
        >
          {category.isActive ? t("categories.hide") : t("categories.show")}
        </button>
      </form>
    </div>
  );
}
