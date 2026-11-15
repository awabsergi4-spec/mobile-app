import { cookies } from "next/headers";
import { ar } from "./ar";
import { en, type MessageKey } from "./en";

// Admin Platform localisation: English / Arabic, chosen with the switch in
// the header (or on the login page) and remembered in a cookie. Arabic
// renders right-to-left (the root layout sets <html dir>).
export type AdminLocale = "en" | "ar";
export const ADMIN_LOCALE_COOKIE = "sahl_admin_locale";

const DICTIONARIES: Record<AdminLocale, Record<MessageKey, string>> = { en, ar };

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export interface AdminI18n {
  locale: AdminLocale;
  dir: "ltr" | "rtl";
  t: Translate;
  /** Label for an enum value, e.g. e("status", "ACTIVE"); falls back to the raw value. */
  e: (group: string, value: string | null | undefined) => string;
  /** Locale-aware date/time and number formatting. */
  date: (value: string | Date) => string;
  dateTime: (value: string | Date) => string;
  number: (value: number) => string;
}

export async function getAdminLocale(): Promise<AdminLocale> {
  const store = await cookies();
  return store.get(ADMIN_LOCALE_COOKIE)?.value === "ar" ? "ar" : "en";
}

export function makeI18n(locale: AdminLocale): AdminI18n {
  const dictionary = DICTIONARIES[locale];
  // Latin digits in both languages: IDs, phones and amounts stay easy to compare.
  const intlLocale = locale === "ar" ? "ar-u-nu-latn" : "en";
  const t: Translate = (key, vars) => {
    const template = dictionary[key] ?? en[key] ?? key;
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
  };
  const e = (group: string, value: string | null | undefined): string => {
    if (!value) return "—";
    const key = `${group}.${value}` as MessageKey;
    return (dictionary as Record<string, string>)[key] ?? (en as Record<string, string>)[key] ?? value;
  };
  return {
    locale,
    dir: locale === "ar" ? "rtl" : "ltr",
    t,
    e,
    date: (v) => new Date(v).toLocaleDateString(intlLocale),
    dateTime: (v) => new Date(v).toLocaleString(intlLocale),
    number: (v) => v.toLocaleString(intlLocale),
  };
}

export async function getI18n(): Promise<AdminI18n> {
  return makeI18n(await getAdminLocale());
}

export type { MessageKey };
