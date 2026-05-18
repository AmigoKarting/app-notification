import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { getServerDictionary } from "@/lib/i18n/server";
import { TeamForm } from "../team-form";

export default function NewTeamPage() {
  const t = getServerDictionary();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminTeams.newTeam}
        action={
          <LinkButton href="/admin/teams" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />
      <Card className="p-6">
        <TeamForm mode="create" />
      </Card>
      <PageTip>{t.pageTips.adminTeamNew}</PageTip>
    </div>
  );
}
