import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { formatMoney } from "@/presentation/admin-ui/format-money";
import { walletRepository } from "@/infrastructure/finance/finance-services";

import { getI18n } from "@/presentation/i18n";
export default async function AdminWalletLookupPage({ searchParams }: { searchParams: Promise<{ walletId?: string }> }) {
  const { t, e, dateTime } = await getI18n();
  try {
    await requireAdminPermission("finance.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="finance.manage" />;
    }
    throw err;
  }

  const { walletId } = await searchParams;
  const wallet = walletId ? await walletRepository.findById(walletId) : null;
  const balances = wallet ? await walletRepository.listBalances(wallet.id) : [];
  const transactions = wallet ? await walletRepository.listTransactions(wallet.id, { limit: 25 }) : [];

  return (
    <div>
      <Link href="/admin/finance" className="text-sm text-primary hover:underline">
        {t("ui.backToFinance")}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">{t("ui.walletLookup")}</h1>

      <form className="mt-4 flex gap-3" method="GET">
        <input
          type="text"
          name="walletId"
          defaultValue={walletId}
          placeholder={t("ui.walletId")}
          className="w-80 rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        />
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.lookUp")}
        </button>
      </form>

      {walletId && !wallet && <p className="mt-4 text-sm text-text-secondary">{t("ui.noWalletFoundWithThatId")}</p>}

      {wallet && (
        <>
          <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-text-secondary">{t("ui.currency")}</dt>
                <dd className="mt-0.5 text-text-primary">{wallet.currency}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">{t("ui.frozen")}</dt>
                <dd className={`mt-0.5 font-medium ${wallet.isFrozen ? "text-error" : "text-success"}`}>
                  {wallet.isFrozen ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {balances.map((b) => (
                <div key={b.bucket} className="rounded-button border border-text-disabled/20 p-3">
                  <p className="text-xs uppercase text-text-secondary">{b.bucket}</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{formatMoney(b.amount, wallet.currency)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
            <h2 className="text-sm font-semibold text-text-primary">{t("ui.recentTransactions")}</h2>
            {transactions.length === 0 ? (
              <p className="mt-2 text-sm text-text-secondary">{t("ui.noTransactions")}</p>
            ) : (
              <table className="mt-3 w-full text-start text-sm">
                <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="px-2 py-2">{t("ui.type")}</th>
                    <th className="px-2 py-2">{t("ui.direction")}</th>
                    <th className="px-2 py-2">{t("ui.amount")}</th>
                    <th className="px-2 py-2">{t("ui.status")}</th>
                    <th className="px-2 py-2">{t("ui.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-text-disabled/10 last:border-0">
                      <td className="px-2 py-2 text-text-primary">{e("enum", t.type)}</td>
                      <td className={`px-2 py-2 ${t.direction === "IN" ? "text-success" : "text-error"}`}>{e("enum", t.direction)}</td>
                      <td className="px-2 py-2 text-text-secondary">{formatMoney(t.amount, t.currency)}</td>
                      <td className="px-2 py-2 text-text-secondary">{e("enum", t.status)}</td>
                      <td className="px-2 py-2 text-text-secondary">{dateTime(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
