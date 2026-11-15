import type { Translate } from "@/presentation/i18n";
import { categoryImagePreview } from "./upload";

// File input + size guidance (+ current picture and "remove" on edit).
export function CategoryImageField({
  t,
  enabled,
  currentUrl,
}: {
  t: Translate;
  enabled: boolean;
  currentUrl?: string | null;
}) {
  return (
    <div className="text-xs font-medium text-text-secondary">
      <span>{t("categories.image")}</span>
      {currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={categoryImagePreview(currentUrl)} alt="" className="mt-2 aspect-video w-full max-w-sm rounded-button object-cover" />
      )}
      {enabled ? (
        <>
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            className="mt-2 block w-full text-sm text-text-primary file:me-3 file:rounded-button file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-primary"
          />
          <p className="mt-1 font-normal">{t("categories.imageGuide")}</p>
          {currentUrl && (
            <label className="mt-2 flex items-center gap-2 font-normal text-text-primary">
              <input type="checkbox" name="removeImage" />
              {t("categories.removeImage")}
            </label>
          )}
        </>
      ) : (
        <p className="mt-1 font-normal text-warning">{t("categories.uploadsOff")}</p>
      )}
    </div>
  );
}
