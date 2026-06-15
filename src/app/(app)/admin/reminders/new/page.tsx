import { Card, EmptyState, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { listEmployees } from "@/domain/employees/repository";
import { ReminderForm } from "../reminder-form";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function NewReminderPage() {
  const t = getServerDictionary();
  const employees = await listEmployees({ limit: 500 });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.reminders.newTitle}
        description={t.reminders.newDesc}
        action={
          <LinkButton href="/admin/reminders" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />

      {employees.length === 0 ? (
        <EmptyState
          title={t.reminders.noEmployees}
          description={t.reminders.noEmployeesDesc}
          action={<LinkButton href="/admin/employees/new">{t.reminders.addEmployee}</LinkButton>}
        />
      ) : (
        <Card className="p-6">
          <ReminderForm
            mode="create"
            employees={employees.map((emp) => ({ id: emp.id, name: emp.name }))}
          />
        </Card>
      )}

      <PageTip>{t.pageTips.reminderNew}</PageTip>
    </div>
  );
}
