import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { listSessions } from "@/domain/sessions/repository";
import { listTeams } from "@/domain/teams/repository";
import { listProfilesWithEmail } from "@/domain/users/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { ScheduleForm } from "../schedule-form";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage() {
  const t = getServerDictionary();
  const [categories, sessions, teams, users] = await Promise.all([
    listCategories(),
    listSessions(),
    listTeams(),
    listProfilesWithEmail(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminSchedules.newSchedule}
        description={t.adminSchedules.newScheduleDesc}
        action={
          <LinkButton href="/admin/schedules" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />
      <Card className="p-6">
        <ScheduleForm
          mode="create"
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
      <PageTip>{t.pageTips.adminScheduleNew}</PageTip>
    </div>
  );
}
