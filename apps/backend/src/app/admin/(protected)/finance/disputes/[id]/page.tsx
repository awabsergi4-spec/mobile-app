import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { formatMoney } from "@/presentation/admin-ui/format-money";
import { disputeRepository } from "@/infrastructure/dispute/dispute-services";
import { escrowRepository } from "@/infrastructure/finance/finance-services";
import { resolveDisputeAction } from "./actions";

import { getI18n } from "@/presentation/i18n";
export default async function AdminDisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, e } = await getI18n();
  try {
    await requireAdminPermission("finance.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="finance.manage" />;
    }
    throw err;
  }

  const { id } = await params;
  const dispute = await disputeRepository.findById(id);

  if (!dispute) {
    return (
      <div>
        <Link href="/admin/finance/disputes" className="text-sm text-primary hover:underline">
          {t("ui.backToDisputes")}
        </Link>
        <p className="mt-4 text-text-secondary">{t("ui.disputeNotFound")}</p>
      </div>
    );
  }

  const escrow = await escrowRepository.findByRelatedEntity(dispute.relatedEntityType, dispute.relatedEntityId);
  const boundResolve = resolveDisputeAction.bind(null, dispute.id);
  const isResolvable = dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW";
  const canAutoResolvePayout = dispute.relatedEntityType === "CONTRACT_MILESTONE" || dispute.relatedEntityType === "REMOTE_MILESTONE";

  return (
    <div>
      <Link href="/admin/finance/disputes" className="text-sm text-primary hover:underline">
        {t("ui.backToDisputes")}
      </Link>

      <div className="mt-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h1 className="text-xl font-semibold text-text-primary">{e("enum", dispute.relatedEntityType)}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-text-secondary">{t("ui.status")}</dt>
            <dd className="mt-0.5 font-medium text-text-primary">{e("enum", dispute.status)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.escrow")}</dt>
            <dd className="mt-0.5 text-text-primary">
              {escrow ? `${formatMoney(escrow.amount, escrow.currency)} (${e("enum", escrow.status)})` : t("ui.noEscrowOnEntity")}
            </dd>
          </div>
          {dispute.resolutionNotes && (
            <div>
              <dt className="text-text-secondary">{t("ui.resolutionNotes")}</dt>
              <dd className="mt-0.5 text-text-primary">{dispute.resolutionNotes}</dd>
            </div>
          )}
        </dl>
        <p className="mt-4 text-sm text-text-secondary">{dispute.reason}</p>
      </div>

      {isResolvable ? (
        escrow && !canAutoResolvePayout ? (
          <div className="mt-6 rounded-card border border-warning/40 bg-surface-light p-6 text-sm text-text-secondary">
            {t("ui.thisDisputesEscrowCantBeResolvedFrom")}
          </div>
        ) : (
          <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
            <h2 className="text-sm font-semibold text-text-primary">{t("ui.resolve")}</h2>
            <form action={boundResolve} className="mt-3 space-y-3">
              <div>
                <label htmlFor="decision" className="block text-xs font-medium text-text-secondary">
                  {t("ui.decision")}
                </label>
                <select
                  id="decision"
                  name="decision"
                  className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                >
                  <option value="REFUND_CUSTOMER">{t("ui.refundCustomer")}</option>
                  {escrow && <option value="RELEASE_TO_PROVIDER">{t("ui.releaseToProvider")}</option>}
                  {escrow && <option value="PARTIAL_SPLIT">{t("ui.partialSplit")}</option>}
                </select>
              </div>
              <div className="flex gap-3">
                <div>
                  <label htmlFor="providerAmount" className="block text-xs font-medium text-text-secondary">
                    {t("ui.providerAmountMinorUnitsPartialSplitOnly")}
                  </label>
                  <input
                    id="providerAmount"
                    name="providerAmount"
                    type="number"
                    className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label htmlFor="refundAmount" className="block text-xs font-medium text-text-secondary">
                    {t("ui.refundAmountMinorUnitsPartialSplitOnly")}
                  </label>
                  <input
                    id="refundAmount"
                    name="refundAmount"
                    type="number"
                    className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="gatewayProvider" className="block text-xs font-medium text-text-secondary">
                  {t("ui.gatewayProvider")}
                </label>
                <input
                  id="gatewayProvider"
                  name="gatewayProvider"
                  defaultValue="mock"
                  className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <div>
                <label htmlFor="resolutionNotes" className="block text-xs font-medium text-text-secondary">
                  {t("ui.resolutionNotes")}
                </label>
                <textarea
                  id="resolutionNotes"
                  name="resolutionNotes"
                  required
                  minLength={3}
                  rows={3}
                  className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
                {t("ui.submitResolution")}
              </button>
            </form>
          </div>
        )
      ) : (
        <p className="mt-6 text-sm text-text-secondary">{t("ui.disputeAlreadyResolved", { status: e("enum", dispute.status) })}</p>
      )}
    </div>
  );
}
