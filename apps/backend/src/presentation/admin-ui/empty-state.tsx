// Shown instead of an empty table body — every list-style admin page uses
// this rather than silently rendering nothing (docs/00-admin-panel-spec.md
// "no blank screens").
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-dashed border-text-disabled/40 p-8 text-center text-sm text-text-secondary">
      {message}
    </div>
  );
}
