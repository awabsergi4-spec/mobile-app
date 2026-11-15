import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { formatMoney } from "@/presentation/admin-ui/format-money";
import { withdrawalRepository } from "@/infrastructure/finance/finance-services";
import {
  approveWithdrawalAction,
  rejectWithdrawalAction,
  markWithdrawalPaidAction,
  markWithdrawalFailedAction,
} from "./actions";

import { getI18n } from "@/presentation/i18n";
export default async function AdminWithdrawalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, e, dateTime } = await getI18n();
  try {
    await requireAdminPermission("finance.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="finance.manage" />;
    }
    throw err;
  }

  const { id } = await params;
  const withdrawal = await withdrawalRepository.findById(id);

  if (!withdrawal) {
    return (
      <div>
        <Link href="/admin/finance/withdrawals" className="text-sm text-primary hover:underline">
          {t("ui.backToWithdrawals")}
        </Link>
        <p className="mt-4 text-text-secondary">{t("ui.withdrawalNotFound")}</p>
      </div>
    );
  }

  const boundApprove = approveWithdrawalAction.bind(null, withdrawal.id);
  const boundReject = rejectWithdrawalAction.bind(null, withdrawal.id);
  const boundMarkPaid = markWithdrawalPaidAction.bind(null, withdrawal.id);
  const boundMarkFailed = markWithdrawalFailedAction.bind(null, withdrawal.id);

  return (
    <div>
      <Link href="/admin/finance/withdrawals" className="text-sm text-primary hover:underline">
        {t("ui.backToWithdrawals")}
      </Link>

      <div className="mt-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h1 className="text-xl font-semibold text-text-primary">{formatMoney(withdrawal.amount + withdrawal.feeMinorUnits, withdrawal.currency)}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-text-secondary">{t("ui.status")}</dt>
            <dd className="mt-0.5 font-medium text-text-primary">{e("enum", withdrawal.status)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.method")}</dt>
            <dd className="mt-0.5 text-text-primary">{e("enum", withdrawal.method)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.fee")}</dt>
            <dd className="mt-0.5 text-text-primary">{formatMoney(withdrawal.feeMinorUnits, withdrawal.currency)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.requested")}</dt>
            <dd className="mt-0.5 text-text-primary">{dateTime(withdrawal.requestedAt)}</dd>
          </div>
          {withdrawal.paidAt && (
            <div>
              <dt className="text-text-secondary">{t("ui.paid")}</dt>
              <dd className="mt-0.5 text-text-primary">{dateTime(withdrawal.paidAt)}</dd>
            </div>
          )}
          {withdrawal.rejectedReason && (
            <div>
              <dt className="text-text-secondary">{t("ui.rejectionReason")}</dt>
              <dd className="mt-0.5 text-text-primary">{withdrawal.rejectedReason}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">{t("ui.actions")}</h2>

        {(withdrawal.status === "REQUESTED" || withdrawal.status === "PENDING_APPROVAL") && (
          <div className="mt-3 flex flex-wrap items-end gap-6">
            <form action={boundApprove}>
              <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
                {t("ui.approve")}
              </button>
            </form>
            <form action={boundReject} className="flex items-end gap-3">
              <div>
                <label htmlFor="reject-reason" className="block text-xs font-medium text-text-secondary">
                  {t("ui.rejectionReason")}
                </label>
                <input
                  id="reject-reason"
                  name="reason"
                  required
                  minLength={3}
                  className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <button type="submit" className="rounded-button bg-error px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                {t("ui.reject")}
              </button>
            </form>
          </div>
        )}

        {withdrawal.status === "PROCESSING" && (
          <div className="mt-3 flex flex-wrap items-end gap-6">
            <form action={boundMarkPaid} className="flex items-end gap-3">
              <div>
                <label htmlFor="gatewayProvider" className="block text-xs font-medium text-text-secondary">
                  {t("ui.gatewayProvider")}
                </label>
                <input
                  id="gatewayProvider"
                  name="gatewayProvider"
                  required
                  defaultValue="mock"
                  className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <div>
                <label htmlFor="gatewayRef" className="block text-xs font-medium text-text-secondary">
                  {t("ui.gatewayReferenceOptional")}
                </label>
                <input
                  id="gatewayRef"
                  name="gatewayRef"
                  className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
                {t("ui.markPaid")}
              </button>
            </form>
            <form action={boundMarkFailed} className="flex items-end gap-3">
              <div>
                <label htmlFor="fail-reason" className="block text-xs font-medium text-text-secondary">
                  {t("ui.failureReason")}
                </label>
                <input
                  id="fail-reason"
                  name="reason"
                  required
                  minLength={3}
                  className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <button type="submit" className="rounded-button bg-error px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                {t("ui.markFailed")}
              </button>
            </form>
          </div>
        )}

        {!["REQUESTED", "PENDING_APPROVAL", "PROCESSING", "APPROVED"].includes(withdrawal.status) && (
          <p className="mt-2 text-sm text-text-secondary">{t("ui.withdrawalNoAction", { status: e("enum", withdrawal.status) })}</p>
        )}
        {withdrawal.status === "APPROVED" && (
          <p className="mt-2 text-sm text-text-secondary">
            {t("ui.withdrawalBatchNote")}{" "}
            <Link href="/admin/finance/settlements" className="text-primary hover:underline">
              {t("ui.settlements")}
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
