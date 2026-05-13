import { notFound } from "next/navigation";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import {
  getFeedItem,
  getFeedItemTargets,
  getReactionSummary,
  getReactionsByUser,
  getReadCount,
  getReadersList,
} from "@/domain/feed/repository";
import { listComments } from "@/domain/comments/repository";
import { formatDateTime } from "@/components/ui";
import { listSessions } from "@/domain/sessions/repository";
import { listTeams } from "@/domain/teams/repository";
import { listProfilesWithEmail } from "@/domain/users/repository";
import { duplicateFeedItemAction } from "@/domain/feed/actions";
import { FeedItemForm } from "../feed-form";
import { DeleteFeedItemForm } from "./delete-form";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function EditFeedItemPage({ params }: PageProps) {
  const [
    item,
    targets,
    categories,
    sessions,
    teams,
    users,
    readCount,
    reactionSummary,
    readers,
    reactionsByUser,
    comments,
  ] = await Promise.all([
    getFeedItem(params.id),
    getFeedItemTargets(params.id),
    listCategories(),
    listSessions(),
    listTeams(),
    listProfilesWithEmail(),
    getReadCount(params.id),
    getReactionSummary(params.id),
    getReadersList(params.id),
    getReactionsByUser(params.id),
    listComments(params.id),
  ]);

  if (!item) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.title}
        description={item.kind === "reminder" ? "Rappel" : "Notification"}
        action={
          <div className="flex gap-2">
            <form action={duplicateFeedItemAction}>
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                📋 Dupliquer
              </button>
            </form>
            <LinkButton href="/admin/feed" variant="secondary">
              Retour
            </LinkButton>
          </div>
        }
      />

      {/* Stats engagement */}
      {!item.is_draft && (
        <Card className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Lectures</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
              {readCount}
            </p>
            <p className="text-xs text-neutral-500">utilisateurs ont marqué comme lu</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Réactions</p>
            {reactionSummary.length === 0 ? (
              <p className="mt-1 text-sm text-neutral-500">Aucune pour le moment.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {reactionSummary.map((r) => (
                  <span
                    key={r.emoji}
                    className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-sm"
                  >
                    <span>{r.emoji}</span>
                    <span className="font-medium text-neutral-700">{r.count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Détail engagement par utilisateur */}
      {!item.is_draft && (readers.length > 0 || reactionsByUser.length > 0 || comments.length > 0) && (
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Détail de l'engagement</h2>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Lecteurs ({readers.length})
              </p>
              {readers.length === 0 ? (
                <p className="text-sm text-neutral-500">Personne pour le moment.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {readers.slice(0, 10).map((r) => (
                    <li key={r.user_id} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {r.display_name?.trim() || r.email || "Sans nom"}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {formatDateTime(r.read_at)}
                      </span>
                    </li>
                  ))}
                  {readers.length > 10 && (
                    <li className="text-xs text-neutral-400">
                      + {readers.length - 10} autres
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Réactions par utilisateur ({reactionsByUser.length})
              </p>
              {reactionsByUser.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucune.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {reactionsByUser.slice(0, 10).map((r) => (
                    <li key={r.user_id} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {r.display_name?.trim() || r.email || "Sans nom"}
                      </span>
                      <span className="text-base">{r.emojis.join(" ")}</span>
                    </li>
                  ))}
                  {reactionsByUser.length > 10 && (
                    <li className="text-xs text-neutral-400">
                      + {reactionsByUser.length - 10} autres
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Commentaires ({comments.length})
              </p>
              {comments.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucun pour le moment.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {comments.slice(-5).map((c) => (
                    <li
                      key={c.id}
                      className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5"
                    >
                      <p className="text-xs text-neutral-500">
                        {c.author?.display_name?.trim() || c.author?.email || "Sans nom"} •{" "}
                        {formatDateTime(c.created_at)}
                      </p>
                      <p className="line-clamp-2 text-neutral-800">{c.body}</p>
                    </li>
                  ))}
                  {comments.length > 5 && (
                    <li className="text-xs text-neutral-400">
                      + {comments.length - 5} précédents
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <FeedItemForm
          mode="edit"
          item={item}
          targets={targets}
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

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="font-medium">Zone de danger</p>
          <p className="text-sm text-neutral-600">La suppression est irréversible.</p>
        </div>
        <DeleteFeedItemForm id={item.id} />
      </Card>
    </div>
  );
}
