import { EmptyState, PageHeader, SparkleIcon } from "@/components/ui";
import { FeedCard } from "@/components/feed-card";
import { requireUser } from "@/domain/auth/session";
import { listMutedCategoryIds } from "@/domain/category-mutes/repository";
import { listComments } from "@/domain/comments/repository";
import { getUserEngagement, listFeedItems } from "@/domain/feed/repository";

export const dynamic = "force-dynamic";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfTomorrow(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() + 1);
  return d;
}

export default async function FeedPage() {
  const user = await requireUser();
  const todayStart = startOfToday();
  const tomorrowStart = startOfTomorrow();

  // Charge en parallèle le filtre des mutes + le feed brut
  const mutedIds = await listMutedCategoryIds(user.id);

  const items = await listFeedItems({
    visibleOnly: true,
    publishedSince: todayStart.toISOString(),
    publishedBefore: tomorrowStart.toISOString(),
    excludeCategoryIds: mutedIds,
    limit: 200,
  });

  // Engagement + commentaires en parallèle
  const itemIds = items.map((i) => i.id);
  const [engagement, ...commentLists] = await Promise.all([
    getUserEngagement(user.id, itemIds),
    ...itemIds.map((id) => listComments(id)),
  ]);
  const commentsById = new Map(itemIds.map((id, idx) => [id, commentLists[idx]!]));

  const todayLabel = todayStart.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications du jour"
        description={`${todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)} — ${items.length} ${
          items.length > 1 ? "publications" : "publication"
        }`}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<SparkleIcon size={32} />}
          title="Rien de neuf aujourd'hui"
          description={
            mutedIds.length > 0
              ? "Aucune notification visible. Tu peux gérer tes préférences dans Réglages → Mes notifications."
              : "Aucune notification publiée aujourd'hui. Reviens plus tard !"
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <FeedCard
              key={it.id}
              item={it}
              engagement={engagement.get(it.id)}
              showEngagement
              comments={commentsById.get(it.id) ?? []}
              currentUserId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
