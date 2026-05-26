import { LinkButton, PageHeader, PageTip } from "@/components/ui";
import { requireDev } from "@/domain/auth/role";
import { listAllChecklistTasks } from "@/domain/checklists/tasks-repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { TasksManager } from "./tasks-manager";

export const dynamic = "force-dynamic";

export default async function ChecklistTasksAdminPage() {
  await requireDev();
  const t = getServerDictionary();
  const tasks = await listAllChecklistTasks();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.checklistAdmin.title}
        description={t.checklistAdmin.description}
        action={
          <LinkButton href="/admin/checklists" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />
      <TasksManager tasks={tasks} />
      <PageTip>{t.checklistAdmin.tip}</PageTip>
    </div>
  );
}
