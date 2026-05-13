import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  formatDateTime,
} from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { listFeedItems } from "@/domain/feed/repository";
import { toggleSessionAction } from "@/domain/sessions/actions";
import { getSession, getSessionStats, isSessionActive } from "@/domain/sessions/repository";
import { SessionForm } from "../session-form";
import { DeleteSessionForm } from "./delete-form";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function EditSessionPage({ params }: PageProps) {
  const [session, categories, items, stats] = await Promise.all([
    getSession(params.id),
    listCategories(),
    listFeedItems({ sessionId: params.id, limit: 50 }),
    getSessionStats(params.id),
  ]);
  if (!session) notFound();
  const inPeriod = isSessionActive(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title={session.name}
        description="Session + notifications qui s'y rattachent."
        action={
          <LinkButton href="/admin/sessions" variant="secondary">
            Retour
          </LinkButton>
        }
      />

      {/* Bandeau état + toggle */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-neutral-500">État :</span>
          <form action={toggleSessionAction}>
            <input type="hidden" name="id" value={session.id} />
            <input type="hidden" name="is_active" value={String(session.is_active)} />
            <button
              type="submit"
              title={session.is_active ? "Désactiver" : "Activer"}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition hover:opacity-80 ${
                !session.is_active
                  ? "bg-neutral-100 text-neutral-700 ring-neutral-200"
                  : inPeriod
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-amber-200"
              }`}
            >
              {!session.is_active ? "Désactivée" : inPeriod ? "En cours" : "Hors période"}
            </button>
          </form>
          {!session.is_active && (
            <span className="text-xs text-neutral-500">
              Tant que la session est désactivée, ses notifications ne s'envoient pas et n'apparaissent pas dans le fil.
            </span>
          )}
        </div>
        <div className="flex gap-4 text-xs text-neutral-500">
          <span>
            <strong className="text-neutral-900">{stats.feed_count}</strong> notif{stats.feed_count > 1 ? "s" : ""}
          </span>
          <span>
            <strong className="text-neutral-900">{stats.schedule_count}</strong> planif
            {stats.schedule_count > 1 ? "s" : ""}
          </span>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Informations</h2>
        <SessionForm
          mode="edit"
          session={session}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </Card>

      {/* Notifications rattachées */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Notifications</h2>
            <p className="text-sm text-neutral-600">
              Notifications et rappels rattachés à cette session.
            </p>
          </div>
          <LinkButton href="/admin/feed/new" variant="secondary">
            Nouvelle
          </LinkButton>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Aucune notification"
            description="Crée une notification et rattache-la à cette session pour la voir ici."
            action={<LinkButton href="/admin/feed/new">Créer une notification</LinkButton>}
          />
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-neutral-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-900">{it.title}</p>
                  <p className="text-xs text-neutral-500">
                    {it.kind === "reminder" ? "Rappel" : "Notification"} •{" "}
                    {formatDateTime(it.published_at)}
                  </p>
                </div>
                <Link
                  href={`/admin/feed/${it.id}`}
                  className="text-sm font-medium text-neutral-900 hover:underline"
                >
                  Ouvrir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="font-medium">Zone de danger</p>
          <p className="text-sm text-neutral-600">
            Les notifications et planifications rattachées seront supprimées en cascade.
          </p>
        </div>
        <DeleteSessionForm id={session.id} name={session.name} />
      </Card>
    </div>
  );
}
