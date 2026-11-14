// Rendered inline by a page when requireAdminPermission() rejects it —
// never thrown across the Server Component boundary as a generic error
// (Next.js's error.tsx strips custom Error subclass info in production, so
// "is this a permission problem or a real bug" would be lost). Pages
// should catch ForbiddenAdminError themselves and render this instead.
export function ForbiddenNotice({ permissionKey }: { permissionKey: string }) {
  return (
    <div className="rounded-card border border-error/30 bg-error/5 p-6">
      <h2 className="text-lg font-semibold text-error">Access denied</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Your account doesn&apos;t have the <code className="font-mono">{permissionKey}</code> permission required for
        this page.
      </p>
    </div>
  );
}
