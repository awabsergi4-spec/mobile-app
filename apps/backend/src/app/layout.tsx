import type { Metadata } from "next";
import { getAdminLocale } from "@/presentation/i18n";
import "./globals.css";

// Root layout — required by the App Router once any page.tsx exists
// alongside the api/ route handlers (route.ts handlers never render this
// tree, so this is purely for the Admin Platform pages). Language and
// direction follow the admin's choice (English LTR / Arabic RTL).
export const metadata: Metadata = {
  title: "SAHL Admin",
  description: "SAHL Admin Platform",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAdminLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>{children}</body>
    </html>
  );
}
