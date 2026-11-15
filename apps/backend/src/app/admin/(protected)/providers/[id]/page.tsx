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

import { getI18n } from "@/presentation/i18n";
export default async function AdminProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, e, dateTime } = await getI18n();
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
          {t("ui.backToProviders")}
        </Link>
        <p className="mt-4 text-text-secondary">{t("ui.providerNotFound")}</p>
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
        {t("ui.backToProviders")}
      </Link>

      <div className="mt-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h1 className="text-xl font-semibold text-text-primary">{provider.businessName}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-text-secondary">{t("ui.status")}</dt>
            <dd className="mt-0.5 font-medium text-text-primary">{e("enum", provider.status)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.verification")}</dt>
            <dd className="mt-0.5 font-medium text-text-primary">{e("enum", provider.verificationStatus)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.availability")}</dt>
            <dd className="mt-0.5 text-text-primary">
              {e("enum", provider.availabilityMode)} {provider.isAvailable ? t("ui.availableParen") : t("ui.unavailableParen")}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.rating")}</dt>
            <dd className="mt-0.5 text-text-primary">
              {provider.ratingAverage.toFixed(1)} {t("ui.reviewsParen", { n: provider.ratingCount })}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.completedJobs")}</dt>
            <dd className="mt-0.5 text-text-primary">{provider.completedJobsCount}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.cancellationRate")}</dt>
            <dd className="mt-0.5 text-text-primary">{(provider.cancellationRate * 100).toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.yearsOfExperience")}</dt>
            <dd className="mt-0.5 text-text-primary">{provider.yearsOfExperience ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.skills")}</dt>
            <dd className="mt-0.5 text-text-primary">{provider.skills.length > 0 ? provider.skills.join(", ") : "—"}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.joined")}</dt>
            <dd className="mt-0.5 text-text-primary">{dateTime(provider.createdAt)}</dd>
          </div>
        </dl>
        {provider.bio && <p className="mt-4 text-sm text-text-secondary">{provider.bio}</p>}
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">{t("section.withCount", { label: t("ui.documents"), n: documents.length })}</h2>
        {documents.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">{t("ui.noDocumentsSubmitted")}</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between rounded-button border border-text-disabled/20 px-3 py-2">
                <span className="text-text-primary">{e("enum", doc.type)}</span>
                <div className="flex items-center gap-3">
                  <span
                    className={
                      doc.status === "APPROVED" ? "text-success" : doc.status === "REJECTED" ? "text-error" : "text-warning"
                    }
                  >
                    {e("enum", doc.status)}
                  </span>
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {t("ui.view")}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">{t("section.withCount", { label: t("ui.portfolio"), n: portfolio.length })}</h2>
        {portfolio.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">{t("ui.noPortfolioItems")}</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-text-primary">
            {portfolio.map((item) => (
              <li key={item.id}>{item.title ?? item.mediaUrl}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">{t("section.withCount", { label: t("ui.payoutAccounts"), n: payoutAccounts.length })}</h2>
        {payoutAccounts.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">{t("ui.noPayoutAccountConfigured")}</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-text-primary">
            {payoutAccounts.map((account) => (
              <li key={account.id}>
                {e("enum", account.method)} {account.isDefault ? t("ui.defaultParen") : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">{t("ui.verificationReview")}</h2>
        <form action={boundReview} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="decision" className="block text-xs font-medium text-text-secondary">
              {t("ui.decision")}
            </label>
            <select
              id="decision"
              name="decision"
              className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            >
              <option value="VERIFIED">{t("ui.verify")}</option>
              <option value="NEEDS_MORE_INFO">{t("ui.needsMoreInfo")}</option>
              <option value="REJECTED">{t("ui.reject")}</option>
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="reason" className="block text-xs font-medium text-text-secondary">
              {t("ui.reasonOptional")}
            </label>
            <input
              id="reason"
              name="reason"
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
            {t("ui.submitDecision")}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">{t("ui.accountActions")}</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          {provider.status === "SUSPENDED" && (
            <form action={boundReactivate}>
              <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
                {t("ui.reactivate")}
              </button>
            </form>
          )}
          {provider.status === "ACTIVE" && (
            <form action={boundSuspend} className="flex items-end gap-3">
              <div>
                <label htmlFor="suspend-reason" className="block text-xs font-medium text-text-secondary">
                  {t("ui.suspensionReason")}
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
                {t("ui.suspend")}
              </button>
            </form>
          )}
          {provider.status !== "DELETED" && (
            <form action={boundDelete}>
              <button type="submit" className="rounded-button bg-error px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                {t("ui.deleteSoft")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
