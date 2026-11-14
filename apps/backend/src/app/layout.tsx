import type { Metadata } from "next";
import "./globals.css";

// Root layout — required by the App Router once any page.tsx exists
// alongside the api/ route handlers (route.ts handlers never render this
// tree, so this is purely for the new Admin Platform pages).
export const metadata: Metadata = {
  title: "SAHL Admin",
  description: "SAHL Admin Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
