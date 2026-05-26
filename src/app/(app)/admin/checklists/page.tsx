import { Card, EmptyState, LinkButton, PageHeader, formatDateTime } from "@/components/ui";
import { requireDev } from "@/domain/auth/role";
import { listRecentChecklists } from "@/domain/checklists/repository";
import { listAllChecklistTasks } from "@/domain/checklists/tasks-repository";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminChecklistsPage() {
  await requireDev();
  const t = getServerDictionary();
  const locale = getLocale();
  const dateFmt = locale === "en" ? "en-US" : "fr-FR";
  const [checklists, allTasks] = await Promise.all([
    listRecentChecklists(),
    listAllChecklistTasks(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.checklist.adminTitle}
        description={t.checklist.adminDescription}
        action={
          <LinkButton href="/admin/checklist-tasks" variant="secondary">
            {t.checklistAdmin.manageTasks}
          </LinkButton>
        }
      />

      {checklists.length === 0 ? (
        <EmptyState
          title={t.checklist.noChecklists}
          description={t.checklist.noChecklistsDesc}
        />
      ) : (
        <div className="space-y-4">
          {checklists.map((cl) => {
            const name =
              (cl.first_name && cl.last_name
                ? `${cl.first_name} ${cl.last_name}`
                : cl.display_name?.trim()) || "—";
            const pct = Math.round((cl.completed_items.length / cl.total_items) * 100);
            const completedSet = new Set(cl.completed_items);
            const missing = allTasks
              .filter((task) => task.is_active && !completedSet.has(task.task_key))
              .map((task) => ({ key: task.task_key, label: task.label }));

            return (
              <Card key={cl.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatDateTime(cl.submitted_at, dateFmt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      pct === 100
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : pct >= 70
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {cl.completed_items.length}/{cl.total_items} ({pct}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct === 100
                        ? "bg-emerald-500"
                        : pct >= 70
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {missing.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                      {t.checklist.missingItems} ({missing.length})
                    </summary>
                    <ul className="mt-2 space-y-1 pl-4">
                      {missing.map((item) => (
                        <li
                          key={item.key}
                          className="list-disc text-xs text-neutral-600 dark:text-neutral-400"
                        >
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {cl.notes && (
                  <p className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    📝 {cl.notes}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
