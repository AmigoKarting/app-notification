import { redirect } from "next/navigation";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { listRecentChecklists } from "@/domain/checklists/repository";
import { listAllChecklistTasks } from "@/domain/checklists/tasks-repository";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";
import { ChecklistHistoryCard } from "./checklist-history-card";

export const dynamic = "force-dynamic";

const SECTION_META: Record<string, { label: string; icon: string; color: string; darkColor: string }> = {
  opening: { label: "Une fois par jour", icon: "🌅", color: "bg-sky-100 text-sky-700", darkColor: "dark:bg-sky-900/30 dark:text-sky-300" },
  during: { label: "Plusieurs fois par jour", icon: "☀️", color: "bg-amber-100 text-amber-700", darkColor: "dark:bg-amber-900/30 dark:text-amber-300" },
  closing: { label: "Avant de partir", icon: "🌙", color: "bg-indigo-100 text-indigo-700", darkColor: "dark:bg-indigo-900/30 dark:text-indigo-300" },
  free_time: { label: "Temps libre", icon: "🎯", color: "bg-purple-100 text-purple-700", darkColor: "dark:bg-purple-900/30 dark:text-purple-300" },
};

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
              <ChecklistHistoryCard
                key={cl.id}
                id={cl.id}
                operatorName={operatorName}
                accountName={accountName}
                showAccount={!!showAccount}
                isSupervisor={isSupervisor}
                completedForRole={completedForRole}
                totalForRole={totalForRole}
                pct={pct}
                submittedAt={cl.submitted_at}
                dateFmt={dateFmt}
                sections={sectionStats.map((s) => {
                  const meta = SECTION_META[s.section] ?? { label: s.section, icon: "📋" };
                  return {
                    section: s.section,
                    label: meta.label,
                    icon: meta.icon,
                    total: s.total,
                    done: s.done.map((tk) => ({ task_key: tk.task_key, label: tk.label })),
                    missed: s.missed.map((tk) => ({ task_key: tk.task_key, label: tk.label })),
                  };
                })}
                timestamps={timestamps}
                notes={cl.notes}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
