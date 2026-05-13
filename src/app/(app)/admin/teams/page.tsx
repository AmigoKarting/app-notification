import Link from "next/link";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { listTeamsWithMemberCount } from "@/domain/teams/repository";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const teams = await listTeamsWithMemberCount();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipes"
        description="Regroupements d'utilisateurs pour cibler les notifications."
        action={<LinkButton href="/admin/teams/new">Nouvelle équipe</LinkButton>}
      />

      {teams.length === 0 ? (
        <EmptyState
          title="Aucune équipe"
          description="Crée une équipe et ajoute des membres pour pouvoir cibler tes notifications."
          action={<LinkButton href="/admin/teams/new">Créer une équipe</LinkButton>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-neutral-100">
            {teams.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-neutral-50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-8 w-8 rounded-full ring-1 ring-neutral-200"
                    style={{ backgroundColor: t.color }}
                  />
                  <div>
                    <p className="font-medium text-neutral-900">{t.name}</p>
                    <p className="text-xs text-neutral-500">
                      <code>{t.slug}</code> •{" "}
                      {t.member_count} {t.member_count > 1 ? "membres" : "membre"}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/admin/teams/${t.id}`}
                  className="text-sm font-medium text-neutral-900 hover:underline"
                >
                  Gérer
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
