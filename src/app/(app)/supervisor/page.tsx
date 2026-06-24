import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { listActiveSupervisorTasks, getTodayDailyTasks, listUnfinishedTasks } from "@/domain/supervisor/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LiveClock } from "@/components/live-clock";
import { SupervisorForm } from "./supervisor-form";
import { UnfinishedBanner } from "./unfinished-banner";
import { DatedAlerts } from "./dated-alerts";

export const dynamic = "force-dynamic";

function todayMontreal(): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Montreal" }));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function SupervisorPage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();

  if (!profile || (profile.role !== "dev" && profile.role !== "superviseur")) {
    redirect("/feed");
  }

  const t = getServerDictionary();
  const today = todayMontreal();
  const supabase = createAdminClient();

  const [tasks, dailyTasks, datedRes, unfinished] = await Promise.all([
    listActiveSupervisorTasks(),
    getTodayDailyTasks(user.id),
    (supabase as any)
      .from("dated_notifications")
      .select("id, date, title, body, snoozed_to")
      .eq("is_active", true)
      .or(`date.eq.${today},snoozed_to.eq.${today}`),
    listUnfinishedTasks(),
  ]);

  const datedNotifs = (datedRes.data ?? []).filter((n: any) => {
    const effective = n.snoozed_to || n.date;
    return effective === today;
  });

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
      <LiveClock />
      <PageHeader
        title={t.supervisor.title}
        description={t.supervisor.description}
      />
      <DatedAlerts notifications={datedNotifs} />
      {unfinished.length > 0 && <UnfinishedBanner tasks={unfinished} />}
      <SupervisorForm tasks={tasks} initialDaily={initialDaily} />
    </div>
  );
}
