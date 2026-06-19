import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { listRecentSupervisorHistory } from "@/domain/supervisor/repository";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SupervisorHistoryPage() {
  await requireUser();
  const profile = await getCurrentProfile();

  if (!profile || (profile.role !== "dev" && profile.role !== "superviseur")) {
    redirect("/feed");
  }

  const t = getServerDictionary();
  const locale = getLocale();
  const dateFmt = locale === "en" ? "en-US" : "fr-FR";
  const supervisorHistory = await listRecentSupervisorHistory();

  const byDate = new Map<string, typeof supervisorHistory>();
  for (const entry of supervisorHistory) {
    const list = byDate.get(entry.date) ?? [];
    list.push(entry);
    byDate.set(entry.date, list);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t.checklist.historyShort} />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
        <span className="flex-1 rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100">
          {t.supervisor.historyTitle}
        </span>
        <Link
          href="/checklist-history"
          className="flex-1 rounded-md px-3 py-2 text-center text-sm font-medium text-neutral-500 transition hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          {t.checklist.adminTitle}
        </Link>
      </div>

      {supervisorHistory.length === 0 ? (
        <EmptyState
          title={t.supervisor.historyEmpty}
          description={t.supervisor.historyEmptyDesc}
        />
      ) : (
        <div className="space-y-5">
          {[...byDate.entries()].map(([date, entries]) => (
            <div key={date}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {new Date(date + "T12:00:00").toLocaleDateString(dateFmt, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <div className="space-y-3">
                {entries.map((entry) => (
                  <Card key={entry.id} className="overflow-hidden">
                    {/* Header: section badge + note */}
                    <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-800/60">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        entry.task_section === "caisse"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      }`}>
                        {entry.task_section === "caisse" ? "🏪 Caisse" : "🏎️ Piste"}
                      </span>
                      {entry.verified_at ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {entry.rating}/10
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          {t.supervisor.historyAssignedOnly}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 p-4">
                      {/* Task name */}
                      <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {entry.task_label}
                      </p>

                      {entry.verified_at && (
                        <>
                          {/* Details grid */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800">
                              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                                Superviseur
                              </p>
                              <p className="mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
                                {entry.supervisor_name}
                              </p>
                            </div>
                            {entry.done_by && (
                              <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                                  Fait par
                                </p>
                                <p className="mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
                                  {entry.done_by}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Status badges */}
                          <div className="flex flex-wrap gap-2">
                            {entry.no_time_to_finish && (
                              <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                ⏱ Pas eu le temps de terminer
                              </span>
                            )}
                            {entry.quality_certified && (
                              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                ✓ Qualité certifiée
                              </span>
                            )}
                          </div>

                          {/* Comment */}
                          {entry.comment && (
                            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                                💬 Commentaire
                              </p>
                              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                {entry.comment}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
