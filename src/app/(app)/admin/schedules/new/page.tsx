import { Card, LinkButton, PageHeader } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { listSessions } from "@/domain/sessions/repository";
import { listTeams } from "@/domain/teams/repository";
import { listProfilesWithEmail } from "@/domain/users/repository";
import { ScheduleForm } from "../schedule-form";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage() {
  const [categories, sessions, teams, users] = await Promise.all([
    listCategories(),
    listSessions(),
    listTeams(),
    listProfilesWithEmail(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle planification"
        description="Configure quand et à qui envoyer cette notification."
        action={
          <LinkButton href="/admin/schedules" variant="secondary">
            Retour
          </LinkButton>
        }
      />
      <Card className="p-6">
        <ScheduleForm
          mode="create"
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
    </div>
  );
}
