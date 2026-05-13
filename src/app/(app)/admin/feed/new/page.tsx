import { Card, LinkButton, PageHeader } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { listSessions } from "@/domain/sessions/repository";
import { listTeams } from "@/domain/teams/repository";
import { listTemplates } from "@/domain/templates/repository";
import { listProfilesWithEmail } from "@/domain/users/repository";
import { FeedItemForm } from "../feed-form";
import { TemplateLoader } from "../template-loader";

export const dynamic = "force-dynamic";

export default async function NewFeedItemPage() {
  const [categories, sessions, teams, users, templates] = await Promise.all([
    listCategories(),
    listSessions(),
    listTeams(),
    listProfilesWithEmail(),
    listTemplates(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvel élément"
        description="Notification ou rappel à publier dans le fil."
        action={
          <LinkButton href="/admin/feed" variant="secondary">
            Retour
          </LinkButton>
        }
      />
      <Card className="p-6 space-y-5">
        <TemplateLoader templates={templates} />
        <FeedItemForm
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
