import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { listActiveSupervisorTasks, getTodayDailyTasks } from "@/domain/supervisor/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { SupervisorForm } from "./supervisor-form";

export const dynamic = "force-dynamic";

export default async function SupervisorPage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();

  if (!profile || (profile.role !== "dev" && profile.role !== "superviseur")) {
    redirect("/feed");
  }

  const t = getServerDictionary();
  const [tasks, dailyTasks] = await Promise.all([
    listActiveSupervisorTasks(),
    getTodayDailyTasks(user.id),
  ]);

  const initialDaily: Record<string, { assigned: boolean; verified: boolean; doneBy: string | null; rating: number | null }> = {};
  for (const task of tasks) {
    const dt = dailyTasks.find((d) => d.task_id === task.id);
    initialDaily[task.id] = {
      assigned: !!dt?.assigned_at,
      verified: !!dt?.verified_at,
      doneBy: dt?.done_by ?? null,
      rating: dt?.rating ?? null,
    };
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={t.supervisor.title}
        description={t.supervisor.description}
      />
      <SupervisorForm tasks={tasks} initialDaily={initialDaily} />
    </div>
  );
}
