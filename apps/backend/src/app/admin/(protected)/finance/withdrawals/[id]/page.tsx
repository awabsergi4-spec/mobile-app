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

export default async function AdminWithdrawalDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
          ← Back to withdrawals
        </Link>
        <p className="mt-4 text-text-secondary">Withdrawal not found.</p>
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
        ← Back to withdrawals
      </Link>

      <div className="mt-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h1 className="text-xl font-semibold text-text-primary">{formatMoney(withdrawal.amount + withdrawal.feeMinorUnits, withdrawal.currency)}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-text-secondary">Status</dt>
            <dd className="mt-0.5 font-medium text-text-primary">{withdrawal.status}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Method</dt>
            <dd className="mt-0.5 text-text-primary">{withdrawal.method}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Fee</dt>
            <dd className="mt-0.5 text-text-primary">{formatMoney(withdrawal.feeMinorUnits, withdrawal.currency)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Requested</dt>
            <dd className="mt-0.5 text-text-primary">{withdrawal.requestedAt.toLocaleString()}</dd>
          </div>
          {withdrawal.paidAt && (
            <div>
              <dt className="text-text-secondary">Paid</dt>
              <dd className="mt-0.5 text-text-primary">{withdrawal.paidAt.toLocaleString()}</dd>
            </div>
          )}
          {withdrawal.rejectedReason && (
            <div>
              <dt className="text-text-secondary">Rejection reason</dt>
              <dd className="mt-0.5 text-text-primary">{withdrawal.rejectedReason}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">Actions</h2>

        {(withdrawal.status === "REQUESTED" || withdrawal.status === "PENDING_APPROVAL") && (
          <div className="mt-3 flex flex-wrap items-end gap-6">
            <form action={boundApprove}>
              <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
                Approve
              </button>
            </form>
            <form action={boundReject} className="flex items-end gap-3">
              <div>
                <label htmlFor="reject-reason" className="block text-xs font-medium text-text-secondary">
                  Rejection reason
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
                Reject
              </button>
            </form>
          </div>
        )}

        {withdrawal.status === "PROCESSING" && (
          <div className="mt-3 flex flex-wrap items-end gap-6">
            <form action={boundMarkPaid} className="flex items-end gap-3">
              <div>
                <label htmlFor="gatewayProvider" className="block text-xs font-medium text-text-secondary">
                  Gateway provider
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
                  Gateway reference (optional)
                </label>
                <input
                  id="gatewayRef"
                  name="gatewayRef"
                  className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
                Mark paid
              </button>
            </form>
            <form action={boundMarkFailed} className="flex items-end gap-3">
              <div>
                <label htmlFor="fail-reason" className="block text-xs font-medium text-text-secondary">
                  Failure reason
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
                Mark failed
              </button>
            </form>
          </div>
        )}

        {!["REQUESTED", "PENDING_APPROVAL", "PROCESSING", "APPROVED"].includes(withdrawal.status) && (
          <p className="mt-2 text-sm text-text-secondary">This withdrawal is {withdrawal.status} — no further action available here.</p>
        )}
        {withdrawal.status === "APPROVED" && (
          <p className="mt-2 text-sm text-text-secondary">
            Approved withdrawals move to PROCESSING once batched into a Settlement — see{" "}
            <Link href="/admin/finance/settlements" className="text-primary hover:underline">
              Settlements
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
