import { Card, PageHeader, formatDateTime } from "@/components/ui";
import { listAuditLogs, type AuditLogEntry } from "@/domain/audit/repository";
import { requireDev } from "@/domain/auth/role";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

function actionLabel(action: string, t: ReturnType<typeof getServerDictionary>["adminAudit"]): string {
  const map: Record<string, string> = {
    create: t.actionCreate,
    update: t.actionUpdate,
    delete: t.actionDelete,
    bulk_delete: t.actionBulkDelete,
  };
  return map[action] ?? action;
}

export default async function AdminAuditPage() {
  await requireDev();
  const t = getServerDictionary();
  const locale = getLocale();
  const dateFmt = locale === "en" ? "en-US" : "fr-FR";

  let logs: AuditLogEntry[] = [];
  try {
    logs = await listAuditLogs({ limit: 100 });
  } catch {
    // silently degrade
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminAudit.title}
        description={t.adminAudit.description}
      />

      {logs.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-neutral-500">{t.adminAudit.noLogs}</p>
        </Card>
      ) : (
        <Card>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-neutral-500">
                  <th className="px-4 py-3">{t.adminAudit.date}</th>
                  <th className="px-4 py-3">{t.adminAudit.user}</th>
                  <th className="px-4 py-3">{t.adminAudit.action}</th>
                  <th className="px-4 py-3">{t.adminAudit.entity}</th>
                  <th className="px-4 py-3">{t.adminAudit.summary}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                      {formatDateTime(log.created_at, dateFmt)}
                    </td>
                    <td className="px-4 py-3">
                      {log.user?.display_name ?? log.user?.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} label={actionLabel(log.action, t.adminAudit)} />
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {log.entity_type}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 max-w-[200px] truncate">
                      {log.summary ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <ActionBadge action={log.action} label={actionLabel(log.action, t.adminAudit)} />
                  <span className="text-xs text-neutral-400">
                    {formatDateTime(log.created_at, dateFmt)}
                  </span>
                </div>
                <p className="text-sm font-medium">
                  {log.user?.display_name ?? log.user?.email ?? "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  {log.entity_type}{log.summary ? ` — ${log.summary}` : ""}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ActionBadge({ action, label }: { action: string; label: string }) {
  const color =
    action === "create"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : action === "update"
        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
