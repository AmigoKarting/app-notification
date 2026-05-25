import Link from "next/link";
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

interface PageProps {
  searchParams?: { q?: string };
}

export default async function FeedPage({ searchParams }: PageProps) {
  const t = getServerDictionary();
  const locale = getLocale();
  const user = await requireUser();
  const todayStart = startOfToday();
  const tomorrowStart = startOfTomorrow();

  const search = searchParams?.q?.trim().toLowerCase() ?? "";

  // Charge en parallèle le filtre des mutes + le feed brut
  const mutedIds = await listMutedCategoryIds(user.id);

  const allItems = await listFeedItems({
    visibleOnly: true,
    publishedSince: todayStart.toISOString(),
    publishedBefore: tomorrowStart.toISOString(),
    excludeCategoryIds: mutedIds,
    limit: 200,
  });

  // Filtre côté serveur par titre/body si recherche active
  const items = search
    ? allItems.filter(
        (it) =>
          it.title.toLowerCase().includes(search) ||
          (it.body?.toLowerCase().includes(search) ?? false),
      )
    : allItems;

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
        description={`${todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)} — ${allItems.length} ${
          allItems.length > 1 ? t.feed.publications : t.feed.publication
        }`}
      />

      <form action="/feed" method="get" className="flex items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder={t.feed.searchPlaceholder}
          className="w-full max-w-md rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-brand-500 dark:focus:ring-brand-900/50"
        />
        {search && (
          <Link
            href="/feed"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
          >
            {t.common.clear}
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        search ? (
          <EmptyState
            icon={<SparkleIcon size={32} />}
            title={t.feed.noSearchResults}
          />
        ) : (
          <EmptyState
            icon={<SparkleIcon size={32} />}
            title={t.feed.nothingToday}
            description={
              mutedIds.length > 0
                ? t.feed.noVisibleNotifications
                : t.feed.noPublishedToday
            }
          />
        )
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
