import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, EmptyState, PageHeader, formatDateTime } from "@/components/ui";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { listRecentChecklists } from "@/domain/checklists/repository";
import { listAllChecklistTasks } from "@/domain/checklists/tasks-repository";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const SECTION_META: Record<string, { label: string; icon: string; color: string; darkColor: string }> = {
  opening: { label: "Une fois par jour", icon: "🌅", color: "bg-sky-100 text-sky-700", darkColor: "dark:bg-sky-900/30 dark:text-sky-300" },
  during: { label: "Plusieurs fois par jour", icon: "☀️", color: "bg-amber-100 text-amber-700", darkColor: "dark:bg-amber-900/30 dark:text-amber-300" },
  closing: { label: "Avant de partir", icon: "🌙", color: "bg-indigo-100 text-indigo-700", darkColor: "dark:bg-indigo-900/30 dark:text-indigo-300" },
  free_time: { label: "Temps libre", icon: "🎯", color: "bg-purple-100 text-purple-700", darkColor: "dark:bg-purple-900/30 dark:text-purple-300" },
};

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Montreal" });
  } catch {
    return "";
  }
}

export default async function ChecklistHistoryPage() {
  await requireUser();
  const profile = await getCurrentProfile();

  if (!profile || (profile.role !== "dev" && profile.role !== "superviseur")) {
    redirect("/feed");
  }

  const t = getServerDictionary();
  const locale = getLocale();
  const dateFmt = locale === "en" ? "en-US" : "fr-FR";
  const [checklists, allTasks] = await Promise.all([
    listRecentChecklists(),
    listAllChecklistTasks(),
  ]);

  const activeTasks = allTasks.filter((task) => task.is_active);
  const sectionOrder = ["opening", "during", "closing", "free_time"];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t.checklist.historyShort} />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
        <Link
          href="/supervisor-history"
          className="flex-1 rounded-md px-3 py-2 text-center text-sm font-medium text-neutral-500 transition hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          {t.supervisor.historyTitle}
        </Link>
        <span className="flex-1 rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100">
          {t.checklist.adminTitle}
        </span>
      </div>

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
            const operatorName = cl.operator_name || accountName;
            const showAccount = cl.operator_name && cl.operator_name !== accountName;
            const pct = cl.total_items > 0 ? Math.round((cl.completed_items.length / cl.total_items) * 100) : 0;
            const completedSet = new Set(cl.completed_items);

            const sectionStats = sectionOrder.map((sec) => {
              const sectionTasks = activeTasks.filter((task) => task.section === sec);
              const done = sectionTasks.filter((task) => completedSet.has(task.task_key));
              const missed = sectionTasks.filter((task) => !completedSet.has(task.task_key));
              return { section: sec, total: sectionTasks.length, done, missed };
            }).filter((s) => s.total > 0);

            const timestamps = cl.completed_timestamps ?? {};

            return (
              <Card key={cl.id} className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {operatorName}
                    </p>
                    {showAccount && (
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                        Compte: {accountName}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {formatDateTime(cl.submitted_at, dateFmt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
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
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
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

                {/* Section breakdown */}
                <div className="mt-4 space-y-2">
                  {sectionStats.map(({ section, total, done, missed }) => {
                    const meta = SECTION_META[section] ?? { label: section, icon: "📋", color: "bg-neutral-100 text-neutral-700", darkColor: "dark:bg-neutral-800 dark:text-neutral-300" };
                    const secPct = Math.round((done.length / total) * 100);

                    return (
                      <div key={section} className="rounded-lg border border-neutral-200 dark:border-neutral-700">
                        {/* Section header */}
                        <div className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color} ${meta.darkColor}`}>
                              {meta.icon} {meta.label}
                            </span>
                          </div>
                          <span className={`text-xs font-semibold ${
                            secPct === 100
                              ? "text-emerald-600 dark:text-emerald-400"
                              : secPct >= 70
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }`}>
                            {done.length}/{total}
                          </span>
                        </div>

                        {/* Completed tasks */}
                        {done.length > 0 && (
                          <div className="border-t border-neutral-100 px-3 py-2 dark:border-neutral-700/50">
                            <ul className="space-y-1">
                              {done.map((task) => {
                                const ts = timestamps[task.task_key];
                                const timeStr = typeof ts === "string" ? formatTime(ts) : Array.isArray(ts) && ts.length > 0 ? formatTime(ts[ts.length - 1]) : "";
                                return (
                                  <li key={task.task_key} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                      <span className="text-[10px]">✅</span>
                                      {task.label}
                                      {Array.isArray(ts) && ts.length > 1 && (
                                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                          x{ts.length}
                                        </span>
                                      )}
                                    </span>
                                    {timeStr && (
                                      <span className="shrink-0 text-[10px] text-neutral-400 dark:text-neutral-500">
                                        {timeStr}
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {/* Missing tasks */}
                        {missed.length > 0 && (
                          <div className="border-t border-neutral-100 px-3 py-2 dark:border-neutral-700/50">
                            <ul className="space-y-1">
                              {missed.map((task) => (
                                <li key={task.task_key} className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                  <span className="text-[10px]">❌</span>
                                  {task.label}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Notes */}
                {cl.notes && (
                  <div className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      Notes
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                      {cl.notes}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
