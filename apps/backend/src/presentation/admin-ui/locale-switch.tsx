import { getAdminLocale } from "@/presentation/i18n";
import { setAdminLocaleAction } from "@/presentation/i18n/locale-actions";

// English / العربية toggle — always labelled in the language it switches TO,
// so it's readable whichever language is on screen.
export async function LocaleSwitch() {
  const locale = await getAdminLocale();
  const target = locale === "ar" ? "en" : "ar";
  return (
    <form action={setAdminLocaleAction.bind(null, target)}>
      <button
        type="submit"
        lang={target}
        className="rounded-button border border-text-disabled/30 px-3 py-1.5 text-sm font-medium text-text-primary hover:border-primary hover:text-primary"
      >
        {target === "ar" ? "العربية" : "English"}
      </button>
    </form>
  );
}
