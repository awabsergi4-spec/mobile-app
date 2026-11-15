import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { companyRepository } from "@/infrastructure/company/company-services";
import type { AccountLifecycleStatus, VerificationStatus } from "@prisma/client";

import { getI18n } from "@/presentation/i18n";
const STATUS_OPTIONS: AccountLifecycleStatus[] = ["ACTIVE", "SUSPENDED", "DELETED"];
const VERIFICATION_OPTIONS: VerificationStatus[] = [
  "UNVERIFIED",
  "PENDING_REVIEW",
  "VERIFIED",
  "REJECTED",
  "NEEDS_MORE_INFO",
  "EXPIRED",
  "REVOKED",
];

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; verificationStatus?: string }>;
}) {
  const { t, e, date } = await getI18n();
  try {
    await requireAdminPermission("companies.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="companies.manage" />;
    }
    throw err;
  }

  const { query, status, verificationStatus } = await searchParams;
  const companies = await companyRepository.search({
    query: query || undefined,
    status: (status as AccountLifecycleStatus) || undefined,
    verificationStatus: (verificationStatus as VerificationStatus) || undefined,
    limit: 50,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary">{t("ui.companies")}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {t("count.shown", { n: companies.length })}
      </p>

      <form className="mt-4 flex flex-wrap gap-3" method="GET">
        <input
          type="text"
          name="query"
          defaultValue={query}
          placeholder={t("ui.searchCompanyName")}
          className="w-64 rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        >
          <option value="">{t("ui.allStatuses")}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {e("enum", s)}
            </option>
          ))}
        </select>
        <select
          name="verificationStatus"
          defaultValue={verificationStatus ?? ""}
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        >
          <option value="">{t("ui.allVerificationStatuses")}</option>
          {VERIFICATION_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {e("enum", v)}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.search")}
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {companies.length === 0 ? (
          <EmptyState message={t("ui.noCompaniesMatchThisSearch")} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t("ui.name")}</th>
                <th className="px-4 py-3">{t("ui.status")}</th>
                <th className="px-4 py-3">{t("ui.verification")}</th>
                <th className="px-4 py-3">{t("ui.joined")}</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-text-disabled/10 last:border-0 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/companies/${company.id}`} className="font-medium text-text-primary hover:text-primary">
                      {company.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={company.status === "ACTIVE" ? "text-success" : "text-error"}>{e("enum", company.status)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={company.verificationStatus === "VERIFIED" ? "text-success" : "text-warning"}>
                      {e("enum", company.verificationStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{date(company.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
