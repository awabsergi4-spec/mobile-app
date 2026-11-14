// Shared across every admin dashboard-style module (finance, on-demand,
// contracts, ...) — one place to keep the "number + label" card styling
// consistent rather than repeating Tailwind classes per page.
export function StatCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "warning" | "error" }) {
  const valueColor = tone === "warning" ? "text-warning" : tone === "error" ? "text-error" : "text-text-primary";
  return (
    <div className="rounded-card border border-text-disabled/20 bg-surface-light p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}
