"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_LOCALE_COOKIE, type AdminLocale } from "./index";

export async function setAdminLocaleAction(locale: AdminLocale): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_LOCALE_COOKIE, locale === "ar" ? "ar" : "en", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
