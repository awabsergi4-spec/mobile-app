import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { formatMoney } from "@/presentation/admin-ui/format-money";
import { escrowRepository } from "@/infrastructure/finance/finance-services";

export default async function AdminEscrowLookupPage({ searchParams }: { searchParams: Promise<{ escrowId?: string }> }) {
  try {
    await requireAdminPermission("finance.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="finance.manage" />;
    }
    throw err;
  }

  const { escrowId } = await searchParams;
  const escrow = escrowId ? await escrowRepository.findById(escrowId) : null;

  return (
    <div>
      <Link href="/admin/finance" className="text-sm text-primary hover:underline">
        ← Back to finance
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">Escrow lookup</h1>

      <form className="mt-4 flex gap-3" method="GET">
        <input
          type="text"
          name="escrowId"
          defaultValue={escrowId}
          placeholder="Escrow ID"
          className="w-80 rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        />
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          Look up
        </button>
      </form>

      {escrowId && !escrow && <p className="mt-4 text-sm text-text-secondary">No escrow found with that ID.</p>}

      {escrow && (
        <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-text-secondary">Related entity</dt>
              <dd className="mt-0.5 text-text-primary">
                {escrow.relatedEntityType} / {escrow.relatedEntityId}
              </dd>
            </div>
            <div>
              <dt className="text-text-secondary">Status</dt>
              <dd className="mt-0.5 font-medium text-text-primary">{escrow.status}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">Held amount</dt>
              <dd className="mt-0.5 text-text-primary">{formatMoney(escrow.amount, escrow.currency)}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">Released</dt>
              <dd className="mt-0.5 text-success">{formatMoney(escrow.releasedAmount, escrow.currency)}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">Refunded</dt>
              <dd className="mt-0.5 text-warning">{formatMoney(escrow.refundedAmount, escrow.currency)}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">Remaining</dt>
              <dd className="mt-0.5 font-medium text-text-primary">
                {formatMoney(escrow.amount - escrow.releasedAmount - escrow.refundedAmount, escrow.currency)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
