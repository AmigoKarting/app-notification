import { notFound } from "next/navigation";
import {
  Card,
  LinkButton,
  PageHeader,
  PageTip,
  StatusBadge,
  formatDateTime,
} from "@/components/ui";
import { listEmployees } from "@/domain/employees/repository";
import { getReminder } from "@/domain/reminders/repository";
import { ReminderForm } from "../reminder-form";
import { DeleteReminderForm } from "./delete-form";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";

interface PageProps {
  params: { id: string };
}

export default async function ReminderDetailPage({ params }: PageProps) {
  const t = getServerDictionary();
  const locale = getLocale();
  const dateFmt = locale === "en" ? "en-US" : "fr-FR";

  const [reminder, employees] = await Promise.all([
    getReminder(params.id),
    listEmployees({ limit: 500 }),
  ]);

  if (!reminder) notFound();

  const descText = t.reminders.detailDesc
    .replace("{name}", reminder.employee?.name ?? "—")
    .replace("{date}", formatDateTime(reminder.scheduled_at, dateFmt));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.reminders.detailTitle}
        description={descText}
        action={
          <LinkButton href="/reminders" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />

      <Card className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 text-sm text-neutral-700">
          <StatusBadge status={reminder.status} />
          {reminder.attempts != null && reminder.attempts > 0 && (
            <span className="text-neutral-500">
              {reminder.attempts} {reminder.attempts > 1 ? t.reminders.attemptsPlural : t.reminders.attempts}
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
          employees={employees.map((emp) => ({ id: emp.id, name: emp.name }))}
        />
      </Card>

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="font-medium text-neutral-900">{t.dangerZone.title}</p>
          <p className="text-sm text-neutral-600">
            {t.reminders.dangerDesc}
          </p>
        </div>
        <DeleteReminderForm id={reminder.id} />
      </Card>

      <PageTip>{t.pageTips.reminderDetail}</PageTip>
    </div>
  );
}
