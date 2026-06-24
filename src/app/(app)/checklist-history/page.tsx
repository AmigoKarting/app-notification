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
            const isSupervisor = cl.role === "superviseur" || cl.role === "dev";
            const targetRole = isSupervisor ? "superviseur" : "caissiere";
            const roleTasks = activeTasks.filter((task) => (task as any).target_role === targetRole);
            const totalForRole = roleTasks.length;
            const completedSet = new Set(cl.completed_items);
            const completedForRole = roleTasks.filter((task) => completedSet.has(task.task_key)).length;
            const pct = totalForRole > 0 ? Math.round((completedForRole / totalForRole) * 100) : 0;

            const sectionStats = sectionOrder.map((sec) => {
              const sectionTasks = roleTasks.filter((task) => task.section === sec);
              const done = sectionTasks.filter((task) => completedSet.has(task.task_key));
              const missed = sectionTasks.filter((task) => !completedSet.has(task.task_key));
              return { section: sec, total: sectionTasks.length, done, missed };
            }).filter((s) => s.total > 0);

            const timestamps = cl.completed_timestamps ?? {};

            return (
              <Card key={cl.id} className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {operatorName}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isSupervisor
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                        : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                    }`}>
                      {isSupervisor ? "Superviseur" : "Caissiere"}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${
                    pct === 100
                      ? "text-emerald-600 dark:text-emerald-400"
                      : pct >= 70
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                  }`}>
                    {completedForRole}/{totalForRole}
                  </span>
                </div>

                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDateTime(cl.submitted_at, dateFmt)}
                  {showAccount && <span> · Compte: {accountName}</span>}
                </p>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <div
                    className={`h-full rounded-full ${
                      pct === 100 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Section breakdown */}
                <div className="mt-4 space-y-3">
                  {sectionStats.map(({ section, total, done, missed }) => {
                    const meta = SECTION_META[section] ?? { label: section, icon: "📋", color: "bg-neutral-100 text-neutral-700", darkColor: "dark:bg-neutral-800 dark:text-neutral-300" };

                    return (
                      <div key={section}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                            {meta.icon} {meta.label}
                          </span>
                          <span className={`text-xs font-semibold ${
                            done.length === total
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-neutral-500"
                          }`}>
                            {done.length}/{total}
                          </span>
                        </div>

                        <div className="mt-1 space-y-0.5 pl-5">
                          {done.map((task) => {
                            const ts = timestamps[task.task_key];
                            const timeStr = typeof ts === "string" ? formatTime(ts) : Array.isArray(ts) && ts.length > 0 ? formatTime(ts[ts.length - 1]) : "";
                            return (
                              <div key={task.task_key} className="flex items-center justify-between text-xs">
                                <span className="text-neutral-700 dark:text-neutral-300">
                                  ✓ {task.label}
                                  {Array.isArray(ts) && ts.length > 1 && (
                                    <span className="ml-1 text-emerald-600 dark:text-emerald-400">×{ts.length}</span>
                                  )}
                                </span>
                                {timeStr && (
                                  <span className="ml-2 shrink-0 text-neutral-400">{timeStr}</span>
                                )}
                              </div>
                            );
                          })}
                          {missed.map((task) => (
                            <p key={task.task_key} className="text-xs text-neutral-400 dark:text-neutral-500">
                              ✗ {task.label}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Notes */}
                {cl.notes && (
                  <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      💬 {cl.notes}
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
