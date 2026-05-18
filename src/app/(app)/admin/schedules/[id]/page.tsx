import { notFound } from "next/navigation";
import { Card, LinkButton, PageHeader, PageTip, formatDateTime } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { listSessions } from "@/domain/sessions/repository";
import { listTeams } from "@/domain/teams/repository";
import { listProfilesWithEmail } from "@/domain/users/repository";
import {
  getSchedule,
  getScheduleTargets,
} from "@/domain/notification-schedules/repository";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";
import { ScheduleForm } from "../schedule-form";
import { DeleteScheduleForm } from "./delete-form";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function EditSchedulePage({ params }: PageProps) {
  const [schedule, targets, categories, sessions, teams, users] = await Promise.all([
    getSchedule(params.id),
    getScheduleTargets(params.id),
    listCategories(),
    listSessions(),
    listTeams(),
    listProfilesWithEmail(),
  ]);

  if (!schedule) notFound();

  const t = getServerDictionary();
  const locale = getLocale();
  const dateFmtLocale = locale === "en" ? "en-US" : "fr-FR";

  return (
    <div className="space-y-6">
      <PageHeader
        title={schedule.title}
        description={t.engagement.editDescription}
        action={
          <LinkButton href="/admin/schedules" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />
      {(schedule.next_run_at || schedule.last_run_at) && (
        <Card className="grid grid-cols-1 gap-3 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              {t.engagement.nextExecution}
            </p>
            <p className="font-medium text-neutral-900">
              {schedule.is_active && schedule.next_run_at
                ? `${new Date(schedule.next_run_at).toLocaleString(dateFmtLocale, {
                    dateStyle: "full",
                    timeStyle: "short",
                    timeZone: schedule.timezone,
                  })} (${schedule.timezone})`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              {t.engagement.lastExecution}
            </p>
            <p className="text-neutral-700">
              {schedule.last_run_at ? formatDateTime(schedule.last_run_at, dateFmtLocale) : "—"}
            </p>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <ScheduleForm
          mode="edit"
          schedule={schedule}
          targets={targets}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          sessions={sessions.map((s) => ({ id: s.id, name: s.name }))}
          teams={teams.map((tm) => ({ id: tm.id, name: tm.name, color: tm.color }))}
          users={users.map((u) => ({
            id: u.id,
            name: u.display_name,
            email: u.email,
          }))}
        />
      </Card>

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="font-medium">{t.dangerZone.title}</p>
          <p className="text-sm text-neutral-600">
            {t.dangerZone.deleteScheduleDesc}
          </p>
        </div>
        <DeleteScheduleForm id={schedule.id} title={schedule.title} />
      </Card>
      <PageTip>{t.pageTips.adminScheduleEdit}</PageTip>
    </div>
  );
}
