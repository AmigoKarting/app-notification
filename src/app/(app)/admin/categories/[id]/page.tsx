import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, EmptyState, LinkButton, PageHeader, formatDateTime } from "@/components/ui";
import { getCategory } from "@/domain/categories/repository";
import { toggleSessionAction } from "@/domain/sessions/actions";
import { isSessionActive, listSessions } from "@/domain/sessions/repository";
import { CategoryForm } from "../category-form";
import { DeleteCategoryForm } from "./delete-form";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: PageProps) {
  const [category, sessions] = await Promise.all([
    getCategory(params.id),
    listSessions({ categoryId: params.id }),
  ]);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={category.name}
        description="Catégorie + sessions qui s'y rattachent."
        action={
          <LinkButton href="/admin/categories" variant="secondary">
            Retour
          </LinkButton>
        }
      />

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Informations</h2>
        <CategoryForm mode="edit" category={category} />
      </Card>

      {/* Sessions de cette catégorie */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Sessions</h2>
            <p className="text-sm text-neutral-600">
              Les sessions de cette catégorie. Désactiver une session stoppe ses notifications.
            </p>
          </div>
          <LinkButton href="/admin/sessions/new" variant="secondary">
            Nouvelle session
          </LinkButton>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            title="Aucune session"
            description="Crée une session pour pouvoir y rattacher des notifications."
            action={<LinkButton href="/admin/sessions/new">Créer une session</LinkButton>}
          />
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {sessions.map((s) => {
              const inPeriod = isSessionActive(s);
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-neutral-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900">{s.name}</p>
                    <p className="text-xs text-neutral-500">
                      {formatDateTime(s.starts_at)} → {formatDateTime(s.ends_at)}
                    </p>
                  </div>
                  <form action={toggleSessionAction}>
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
                  <Link
                    href={`/admin/sessions/${s.id}`}
                    className="text-sm font-medium text-neutral-900 hover:underline"
                  >
                    Ouvrir
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="font-medium">Zone de danger</p>
          <p className="text-sm text-neutral-600">
            Les sessions de cette catégorie perdront leur lien mais ne seront pas supprimées.
          </p>
        </div>
        <DeleteCategoryForm id={category.id} name={category.name} />
      </Card>
    </div>
  );
}
