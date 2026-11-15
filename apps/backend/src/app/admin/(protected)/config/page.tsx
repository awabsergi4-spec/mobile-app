import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { remoteConfigRepository } from "@/infrastructure/remote-config/remote-config-services";

import { getI18n } from "@/presentation/i18n";
export default async function AdminRemoteConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { t, e } = await getI18n();
  try {
    await requireAdminPermission("config.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="config.manage" />;
    }
    throw err;
  }

  const { key } = await searchParams;
  const entries = await remoteConfigRepository.search({ key });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{t("ui.remoteConfig")}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t("count.config", { n: entries.length })}
          </p>
        </div>
        <Link href="/admin/config/new" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.newEntry")}
        </Link>
      </div>

      <form className="mt-4 flex gap-3" method="GET">
        <input
          name="key"
          defaultValue={key ?? ""}
          placeholder={t("ui.searchByKey")}
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        />
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.filter")}
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {entries.length === 0 ? (
          <EmptyState message={t("ui.noConfigEntriesMatchThisFilter")} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t("ui.key")}</th>
                <th className="px-4 py-3">{t("ui.type")}</th>
                <th className="px-4 py-3">{t("ui.value")}</th>
                <th className="px-4 py-3">{t("ui.scope")}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-text-disabled/10 last:border-0 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/config/${entry.id}`} className="font-medium text-text-primary hover:text-primary">
                      {entry.key}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{e("enum", entry.valueType)}</td>
                  <td className="px-4 py-3 text-text-secondary">{JSON.stringify(entry.value)}</td>
                  <td className="px-4 py-3 text-text-secondary">{entry.regionId ? "Region" : "Global"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
