import { Card, LinkButton, PageHeader } from "@/components/ui";
import { TeamForm } from "../team-form";

export default function NewTeamPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle équipe"
        action={
          <LinkButton href="/admin/teams" variant="secondary">
            Retour
          </LinkButton>
        }
      />
      <Card className="p-6">
        <TeamForm mode="create" />
      </Card>
    </div>
  );
}
