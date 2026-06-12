import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { getTodayCompleted } from "@/domain/checklists/repository";
import { listActiveChecklistTasks } from "@/domain/checklists/tasks-repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { ChecklistForm } from "./checklist-form";

export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  const t = getServerDictionary();
  const user = await requireUser();
  const profile = await getCurrentProfile();

  if (profile?.role !== "caissiere" && profile?.role !== "dev") {
    redirect("/feed");
  }

  const [completed, tasks] = await Promise.all([
    getTodayCompleted(user.id),
    listActiveChecklistTasks(),
  ]);

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
        initialCompleted={completed}
        userName={profile?.first_name || undefined}
      />
    </div>
  );
}
