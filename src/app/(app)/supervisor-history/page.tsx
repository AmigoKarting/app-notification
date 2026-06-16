import { redirect } from "next/navigation";
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
      <PageHeader
        title={t.supervisor.historyTitle}
        description={t.supervisor.historyEmptyDesc}
      />

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
    </div>
  );
}
