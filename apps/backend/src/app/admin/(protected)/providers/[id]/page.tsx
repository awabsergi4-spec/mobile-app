import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import {
  providerProfileRepository,
  providerDocumentRepository,
  providerPortfolioRepository,
  providerPayoutAccountRepository,
} from "@/infrastructure/provider/provider-services";
import {
  suspendProviderAction,
  reactivateProviderAction,
  deleteProviderAction,
  reviewProviderVerificationAction,
} from "./actions";

export default async function AdminProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminPermission("providers.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="providers.manage" />;
    }
    throw err;
  }

  const { id } = await params;
  const provider = await providerProfileRepository.findById(id);

  if (!provider) {
    return (
      <div>
        <Link href="/admin/providers" className="text-sm text-primary hover:underline">
          ← Back to providers
        </Link>
        <p className="mt-4 text-text-secondary">Provider not found.</p>
      </div>
    );
  }

  const [documents, portfolio, payoutAccounts] = await Promise.all([
    providerDocumentRepository.listByProviderId(id),
    providerPortfolioRepository.listByProviderId(id),
    providerPayoutAccountRepository.listByProviderId(id),
  ]);

  const boundSuspend = suspendProviderAction.bind(null, provider.id);
  const boundReactivate = reactivateProviderAction.bind(null, provider.id);
  const boundDelete = deleteProviderAction.bind(null, provider.id);
  const boundReview = reviewProviderVerificationAction.bind(null, provider.id);

  return (
    <div>
      <Link href="/admin/providers" className="text-sm text-primary hover:underline">
        ← Back to providers
      </Link>

      <div className="mt-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h1 className="text-xl font-semibold text-text-primary">{provider.businessName}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-text-secondary">Status</dt>
            <dd className="mt-0.5 font-medium text-text-primary">{provider.status}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Verification</dt>
            <dd className="mt-0.5 font-medium text-text-primary">{provider.verificationStatus}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Availability</dt>
            <dd className="mt-0.5 text-text-primary">
              {provider.availabilityMode} {provider.isAvailable ? "(available)" : "(unavailable)"}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Rating</dt>
            <dd className="mt-0.5 text-text-primary">
              {provider.ratingAverage.toFixed(1)} ({provider.ratingCount} reviews)
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Completed jobs</dt>
            <dd className="mt-0.5 text-text-primary">{provider.completedJobsCount}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Cancellation rate</dt>
            <dd className="mt-0.5 text-text-primary">{(provider.cancellationRate * 100).toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Years of experience</dt>
            <dd className="mt-0.5 text-text-primary">{provider.yearsOfExperience ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Skills</dt>
            <dd className="mt-0.5 text-text-primary">{provider.skills.length > 0 ? provider.skills.join(", ") : "—"}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Joined</dt>
            <dd className="mt-0.5 text-text-primary">{provider.createdAt.toLocaleString()}</dd>
          </div>
        </dl>
        {provider.bio && <p className="mt-4 text-sm text-text-secondary">{provider.bio}</p>}
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">Documents ({documents.length})</h2>
        {documents.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">No documents submitted.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between rounded-button border border-text-disabled/20 px-3 py-2">
                <span className="text-text-primary">{doc.type}</span>
                <div className="flex items-center gap-3">
                  <span
                    className={
                      doc.status === "APPROVED" ? "text-success" : doc.status === "REJECTED" ? "text-error" : "text-warning"
                    }
                  >
                    {doc.status}
                  </span>
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    View
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">Portfolio ({portfolio.length})</h2>
        {portfolio.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">No portfolio items.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-text-primary">
            {portfolio.map((item) => (
              <li key={item.id}>{item.title ?? item.mediaUrl}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">Payout accounts ({payoutAccounts.length})</h2>
        {payoutAccounts.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">No payout account configured.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-text-primary">
            {payoutAccounts.map((account) => (
              <li key={account.id}>
                {account.method} {account.isDefault ? "(default)" : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">Verification review</h2>
        <form action={boundReview} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="decision" className="block text-xs font-medium text-text-secondary">
              Decision
            </label>
            <select
              id="decision"
              name="decision"
              className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            >
              <option value="VERIFIED">Verify</option>
              <option value="NEEDS_MORE_INFO">Needs more info</option>
              <option value="REJECTED">Reject</option>
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="reason" className="block text-xs font-medium text-text-secondary">
              Reason (optional)
            </label>
            <input
              id="reason"
              name="reason"
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
            Submit decision
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">Account actions</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          {provider.status === "SUSPENDED" && (
            <form action={boundReactivate}>
              <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
                Reactivate
              </button>
            </form>
          )}
          {provider.status === "ACTIVE" && (
            <form action={boundSuspend} className="flex items-end gap-3">
              <div>
                <label htmlFor="suspend-reason" className="block text-xs font-medium text-text-secondary">
                  Suspension reason
                </label>
                <input
                  id="suspend-reason"
                  name="reason"
                  required
                  minLength={3}
                  className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <button type="submit" className="rounded-button bg-warning px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                Suspend
              </button>
            </form>
          )}
          {provider.status !== "DELETED" && (
            <form action={boundDelete}>
              <button type="submit" className="rounded-button bg-error px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                Delete (soft)
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
