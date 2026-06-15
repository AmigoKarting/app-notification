import Link from "next/link";
import { Card, EmptyState, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { listTeamsWithMemberCount } from "@/domain/teams/repository";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const t = getServerDictionary();
  const teams = await listTeamsWithMemberCount();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminTeams.title}
        description={t.adminTeams.description}
        helpHref="/admin/aide/equipes"
        action={<LinkButton href="/admin/teams/new">{t.adminTeams.newTeam}</LinkButton>}
      />
      {teams.length === 0 ? (
        <EmptyState
          title={t.adminTeams.noTeams}
          description={t.adminTeams.noTeamsDesc}
          action={<LinkButton href="/admin/teams/new">{t.adminTeams.createTeam}</LinkButton>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-neutral-100">
            {teams.map((team) => (
              <li
                key={team.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-neutral-50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-8 w-8 rounded-full ring-1 ring-neutral-200"
                    style={{ backgroundColor: team.color }}
                  />
                  <div>
                    <p className="font-medium text-neutral-900">{team.name}</p>
                    <p className="text-xs text-neutral-500">
                      <code>{team.slug}</code> •{" "}
                      {team.member_count} {team.member_count > 1 ? t.adminTeams.members : t.adminTeams.member}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/admin/teams/${team.id}`}
                  className="text-sm font-medium text-neutral-900 hover:underline"
                >
                  {t.adminTeams.manage}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <PageTip>{t.pageTips.adminTeams}</PageTip>
    </div>
  );
}
