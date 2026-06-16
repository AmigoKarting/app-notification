import { redirect } from "next/navigation";
import { Card, EmptyState, PageHeader, formatDateTime } from "@/components/ui";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { listRecentChecklists } from "@/domain/checklists/repository";
import { listAllChecklistTasks } from "@/domain/checklists/tasks-repository";
import { listRecentSupervisorHistory } from "@/domain/supervisor/repository";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ChecklistHistoryPage() {
  await requireUser();
  const profile = await getCurrentProfile();

  if (!profile || (profile.role !== "dev" && profile.role !== "superviseur")) {
    redirect("/feed");
  }

  const t = getServerDictionary();
  const locale = getLocale();
  const dateFmt = locale === "en" ? "en-US" : "fr-FR";
  const [checklists, allTasks, supervisorHistory] = await Promise.all([
    listRecentChecklists(),
    listAllChecklistTasks(),
    listRecentSupervisorHistory(),
  ]);

  // Group supervisor history by date
  const supervisorByDate = new Map<string, typeof supervisorHistory>();
  for (const entry of supervisorHistory) {
    const list = supervisorByDate.get(entry.date) ?? [];
    list.push(entry);
    supervisorByDate.set(entry.date, list);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title={t.checklist.historyShort}
        description={t.checklist.adminDescription}
      />

      {/* ─── Checklists caissières ─── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-neutral-900 dark:text-neutral-100">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-sm dark:bg-brand-900/40">
            🗂
          </span>
          {t.checklist.adminTitle}
        </h2>

        {checklists.length === 0 ? (
          <EmptyState
            title={t.checklist.noChecklists}
            description={t.checklist.noChecklistsDesc}
          />
        ) : (
          <div className="space-y-4">
            {checklists.map((cl) => {
              const accountName =
                (cl.first_name && cl.last_name
                  ? `${cl.first_name} ${cl.last_name}`
                  : cl.display_name?.trim()) || "—";
              const name = cl.operator_name || accountName;
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
                      {cl.notes}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Historique superviseur ─── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-neutral-900 dark:text-neutral-100">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-sm dark:bg-emerald-900/40">
            ✅
          </span>
          {t.supervisor.historyTitle}
        </h2>

        {supervisorHistory.length === 0 ? (
          <EmptyState
            title={t.supervisor.historyEmpty}
            description={t.supervisor.historyEmptyDesc}
          />
        ) : (
          <div className="space-y-5">
            {[...supervisorByDate.entries()].map(([date, entries]) => (
              <div key={date}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {new Date(date + "T12:00:00").toLocaleDateString(dateFmt, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <Card key={entry.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {entry.task_label}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                            <span className="capitalize">{entry.task_section}</span>
                            {" · "}
                            {entry.supervisor_name}
                          </p>
                        </div>
                        {entry.verified_at ? (
                          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {entry.rating}/10
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            {t.supervisor.historyAssignedOnly}
                          </span>
                        )}
                      </div>

                      {entry.verified_at && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {entry.done_by && (
                            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                              {t.supervisor.historyDoneBy}: {entry.done_by}
                            </span>
                          )}
                          {entry.no_time_to_finish && (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              {t.supervisor.historyNoTime}
                            </span>
                          )}
                          {entry.quality_certified && (
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              {t.supervisor.historyCertified}
                            </span>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
