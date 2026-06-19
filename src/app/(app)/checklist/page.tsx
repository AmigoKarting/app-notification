import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { getStreak, getTodayCompleted } from "@/domain/checklists/repository";
import { listActiveChecklistTasks } from "@/domain/checklists/tasks-repository";
import { isRecyclingDay } from "@/domain/checklists/recycling";
import { listCashierNames, listSupervisorNames } from "@/domain/users/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { ChecklistForm } from "./checklist-form";

export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  const t = getServerDictionary();
  const user = await requireUser();
  const profile = await getCurrentProfile();

  const isCashier = profile?.role === "caissiere";
  const isSupervisor = profile?.role === "superviseur";
  const isDev = profile?.role === "dev";

  if (!isCashier && !isSupervisor && !isDev) {
    redirect("/feed");
  }

  const targetRole = isSupervisor ? "superviseur" : "caissiere";

  const [todayData, allTasks, streak, cashiers, supervisors, recyclingToday] = await Promise.all([
    getTodayCompleted(user.id),
    listActiveChecklistTasks(targetRole),
    getStreak(user.id),
    listCashierNames(),
    listSupervisorNames(),
    isSupervisor || isDev ? isRecyclingDay() : Promise.resolve(false),
  ]);

  const tasks = allTasks;
  const lockedTasks = recyclingToday ? [] : ["sup_recyclage"];

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader
        title={t.checklist.title}
        description={t.checklist.description}
      />

      <ChecklistForm
        tasks={tasks.map((tk) => ({
          key: tk.task_key,
          section: tk.section,
          label: tk.label,
        }))}
        lockedTasks={lockedTasks}
        initialCompleted={todayData.completedItems}
        initialTimestamps={todayData.timestamps}
        initialOperator={todayData.operatorName ?? undefined}
        userName={profile?.first_name || undefined}
        streak={streak}
        operators={isSupervisor ? supervisors : cashiers}
        role={targetRole}
      />
    </div>
  );
}
