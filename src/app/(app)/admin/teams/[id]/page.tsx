import { notFound } from "next/navigation";
import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { getTeam, listTeamMemberIds } from "@/domain/teams/repository";
import { listProfilesWithEmail } from "@/domain/users/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { TeamForm } from "../team-form";
import { DeleteTeamForm } from "./delete-form";
import { MembersForm } from "./members-form";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function EditTeamPage({ params }: PageProps) {
  const t = getServerDictionary();
  const [team, members, users] = await Promise.all([
    getTeam(params.id),
    listTeamMemberIds(params.id),
    listProfilesWithEmail(),
  ]);

  if (!team) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={team.name}
        description={`${t.adminTeams.teamDesc} • ${members.length} ${members.length > 1 ? t.adminTeams.members : t.adminTeams.member}`}
        action={
          <LinkButton href="/admin/teams" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />
      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">{t.adminCategories.information}</h2>
        <TeamForm mode="edit" team={team} />
      </Card>

      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-neutral-900">{t.adminTeams.membersTitle}</h2>
          <p className="text-sm text-neutral-600">
            {t.adminTeams.membersDesc}
          </p>
        </div>
        <MembersForm
          teamId={team.id}
          initialMemberIds={members}
          users={users.map((u) => ({
            id: u.id,
            name: u.display_name,
            email: u.email,
            role: u.role,
          }))}
        />
      </Card>

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="font-medium">{t.dangerZone.title}</p>
          <p className="text-sm text-neutral-600">
            {t.adminTeams.deleteTeamDesc}
          </p>
        </div>
        <DeleteTeamForm id={team.id} name={team.name} />
      </Card>
      <PageTip>{t.pageTips.adminTeamEdit}</PageTip>
    </div>
  );
}
