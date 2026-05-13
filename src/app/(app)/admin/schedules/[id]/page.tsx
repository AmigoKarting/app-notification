import { notFound } from "next/navigation";
import { Card, LinkButton, PageHeader, formatDateTime } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { listSessions } from "@/domain/sessions/repository";
import { listTeams } from "@/domain/teams/repository";
import { listProfilesWithEmail } from "@/domain/users/repository";
import {
  getSchedule,
  getScheduleTargets,
} from "@/domain/notification-schedules/repository";
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={schedule.title}
        description="Modifier la planification."
        action={
          <LinkButton href="/admin/schedules" variant="secondary">
            Retour
          </LinkButton>
        }
      />

      {(schedule.next_run_at || schedule.last_run_at) && (
        <Card className="grid grid-cols-1 gap-3 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Prochaine exécution
            </p>
            <p className="font-medium text-neutral-900">
              {schedule.is_active && schedule.next_run_at
                ? `${new Date(schedule.next_run_at).toLocaleString("fr-FR", {
                    dateStyle: "full",
                    timeStyle: "short",
                    timeZone: schedule.timezone,
                  })} (${schedule.timezone})`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Dernière exécution
            </p>
            <p className="text-neutral-700">
              {schedule.last_run_at ? formatDateTime(schedule.last_run_at) : "—"}
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
          teams={teams.map((t) => ({ id: t.id, name: t.name, color: t.color }))}
          users={users.map((u) => ({
            id: u.id,
            name: u.display_name,
            email: u.email,
          }))}
        />
      </Card>

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="font-medium">Zone de danger</p>
          <p className="text-sm text-neutral-600">
            Supprimer arrête définitivement la planification. L'historique des envois passés reste.
          </p>
        </div>
        <DeleteScheduleForm id={schedule.id} title={schedule.title} />
      </Card>
    </div>
  );
}
