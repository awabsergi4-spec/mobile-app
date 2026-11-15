import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { companyRepository, companyMemberRepository, companyDocumentRepository } from "@/infrastructure/company/company-services";
import {
  suspendCompanyAction,
  reactivateCompanyAction,
  deleteCompanyAction,
  reviewCompanyVerificationAction,
} from "./actions";

import { getI18n } from "@/presentation/i18n";
export default async function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, e, dateTime } = await getI18n();
  try {
    await requireAdminPermission("companies.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="companies.manage" />;
    }
    throw err;
  }

  const { id } = await params;
  const company = await companyRepository.findById(id);

  if (!company) {
    return (
      <div>
        <Link href="/admin/companies" className="text-sm text-primary hover:underline">
          {t("ui.backToCompanies")}
        </Link>
        <p className="mt-4 text-text-secondary">{t("ui.companyNotFound")}</p>
      </div>
    );
  }

  const [members, documents] = await Promise.all([
    companyMemberRepository.listByCompanyId(id),
    companyDocumentRepository.listByCompanyId(id),
  ]);

  const boundSuspend = suspendCompanyAction.bind(null, company.id);
  const boundReactivate = reactivateCompanyAction.bind(null, company.id);
  const boundDelete = deleteCompanyAction.bind(null, company.id);
  const boundReview = reviewCompanyVerificationAction.bind(null, company.id);

  return (
    <div>
      <Link href="/admin/companies" className="text-sm text-primary hover:underline">
        {t("ui.backToCompanies")}
      </Link>

      <div className="mt-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h1 className="text-xl font-semibold text-text-primary">{company.name}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-text-secondary">{t("ui.status")}</dt>
            <dd className="mt-0.5 font-medium text-text-primary">{e("enum", company.status)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.verification")}</dt>
            <dd className="mt-0.5 font-medium text-text-primary">{e("enum", company.verificationStatus)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.members")}</dt>
            <dd className="mt-0.5 text-text-primary">{members.length}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.joined")}</dt>
            <dd className="mt-0.5 text-text-primary">{dateTime(company.createdAt)}</dd>
          </div>
        </dl>
        {company.description && <p className="mt-4 text-sm text-text-secondary">{company.description}</p>}
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">{t("section.withCount", { label: t("ui.members"), n: members.length })}</h2>
        {members.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">{t("ui.noMembers")}</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between rounded-button border border-text-disabled/20 px-3 py-2">
                <span className="text-text-primary" dir="ltr">
                  {member.userId}
                </span>
                <span className="text-text-secondary">{member.role}</span>
              </li>
            ))}
          </ul>
        )}
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
          {company.status === "SUSPENDED" && (
            <form action={boundReactivate}>
              <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
                {t("ui.reactivate")}
              </button>
            </form>
          )}
          {company.status === "ACTIVE" && (
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
          {company.status !== "DELETED" && (
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
