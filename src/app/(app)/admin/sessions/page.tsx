import Link from "next/link";
import { Card, EmptyState, LinkButton, PageHeader, formatDateTime } from "@/components/ui";
import { toggleSessionAction } from "@/domain/sessions/actions";
import { isSessionActive, listSessions } from "@/domain/sessions/repository";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: { category?: string };
}

export default async function AdminSessionsPage({ searchParams }: PageProps) {
  const sessions = await listSessions({ categoryId: searchParams?.category });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Périodes qui contrôlent la visibilité et l'envoi des notifications."
        action={<LinkButton href="/admin/sessions/new">Nouvelle session</LinkButton>}
      />

      {sessions.length === 0 ? (
        <EmptyState
          title="Aucune session"
          description={
            searchParams?.category
              ? "Aucune session pour cette catégorie."
              : "Crée une session pour faire varier les notifications selon la période."
          }
          action={<LinkButton href="/admin/sessions/new">Créer une session</LinkButton>}
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nom</th>
                <th className="px-4 py-2 font-medium">Catégorie</th>
                <th className="px-4 py-2 font-medium">Période</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {sessions.map((s) => {
                const inPeriod = isSessionActive(s);
                return (
                  <tr key={s.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">{s.name}</p>
                      <p className="text-xs text-neutral-500">{s.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      {s.category ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
                          style={{
                            backgroundColor: `${s.category.color}20`,
                            color: s.category.color,
                            borderColor: `${s.category.color}40`,
                          }}
                        >
                          {s.category.icon && <span>{s.category.icon}</span>}
                          {s.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {formatDateTime(s.starts_at)} → {formatDateTime(s.ends_at)}
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleSessionAction} className="inline-flex items-center gap-2">
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="is_active" value={String(s.is_active)} />
                        <button
                          type="submit"
                          title={s.is_active ? "Désactiver" : "Activer"}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition hover:opacity-80 ${
                            !s.is_active
                              ? "bg-neutral-100 text-neutral-700 ring-neutral-200"
                              : inPeriod
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-amber-50 text-amber-700 ring-amber-200"
                          }`}
                        >
                          {!s.is_active ? "Désactivée" : inPeriod ? "En cours" : "Hors période"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/sessions/${s.id}`}
                        className="text-sm font-medium text-neutral-900 hover:underline"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
