import { notFound } from "next/navigation";
import {
  Card,
  LinkButton,
  PageHeader,
  StatusBadge,
  formatDateTime,
} from "@/components/ui";
import { listEmployees } from "@/domain/employees/repository";
import { getReminder } from "@/domain/reminders/repository";
import { ReminderForm } from "../reminder-form";
import { DeleteReminderForm } from "./delete-form";

interface PageProps {
  params: { id: string };
}

export default async function ReminderDetailPage({ params }: PageProps) {
  const [reminder, employees] = await Promise.all([
    getReminder(params.id),
    listEmployees({ limit: 500 }),
  ]);

  if (!reminder) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Détail du rappel"
        description={`Pour ${reminder.employee?.name ?? "—"} • Échéance ${formatDateTime(reminder.scheduled_at)}`}
        action={
          <LinkButton href="/reminders" variant="secondary">
            Retour
          </LinkButton>
        }
      />

      <Card className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 text-sm text-neutral-700">
          <StatusBadge status={reminder.status} />
          {reminder.attempts != null && reminder.attempts > 0 && (
            <span className="text-neutral-500">
              {reminder.attempts} tentative{reminder.attempts > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {reminder.last_error && (
          <p className="truncate text-xs text-red-600" title={reminder.last_error}>
            {reminder.last_error}
          </p>
        )}
      </Card>

      <Card className="p-6">
        <ReminderForm
          mode="edit"
          reminder={reminder}
          employees={employees.map((e) => ({ id: e.id, name: e.name }))}
        />
      </Card>

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="font-medium text-neutral-900">Zone de danger</p>
          <p className="text-sm text-neutral-600">
            La suppression est irréversible.
          </p>
        </div>
        <DeleteReminderForm id={reminder.id} />
      </Card>
    </div>
  );
}
