// Every monetary value in this codebase is stored/transmitted in minor
// units (see ADR-008) — this is the one place that turns that into a
// human-readable string for the Admin Platform, so no page hand-rolls its
// own /100 + toFixed.
export function formatMoney(amountMinorUnits: number, currency: string): string {
  const majorUnits = amountMinorUnits / 100;
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, currencyDisplay: "code" }).format(majorUnits);
  } catch {
    return `${majorUnits.toFixed(2)} ${currency}`;
  }
}
