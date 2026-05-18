import { EmptyState, PageHeader, PageTip, SparkleIcon } from "@/components/ui";
import { FeedCard } from "@/components/feed-card";
import { requireUser } from "@/domain/auth/session";
import { listMutedCategoryIds } from "@/domain/category-mutes/repository";
import { listComments } from "@/domain/comments/repository";
import { getUserEngagement, listFeedItems } from "@/domain/feed/repository";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";

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
  const t = getServerDictionary();
  const locale = getLocale();
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

  const todayLabel = todayStart.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.feed.title}
        description={`${todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)} — ${items.length} ${
          items.length > 1 ? t.feed.publications : t.feed.publication
        }`}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<SparkleIcon size={32} />}
          title={t.feed.nothingToday}
          description={
            mutedIds.length > 0
              ? t.feed.noVisibleNotifications
              : t.feed.noPublishedToday
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

      <PageTip>{t.pageTips.feed}</PageTip>
    </div>
  );
}
