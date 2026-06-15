import { formatDateTime } from "@/components/ui";
import { FeedCardActions } from "@/components/feed-card-actions";
import { FeedComments } from "@/components/feed-comments";
import { ReactionBar, ReadToggle } from "@/components/feed-engagement";
import type { CommentWithAuthor } from "@/domain/comments/repository";
import type { FeedItemEngagement, FeedItemWithRelations } from "@/domain/feed/repository";
import { renderMarkdown } from "@/lib/markdown";
import { getServerDictionary, getLocale, getDateFormat } from "@/lib/i18n/server";

const PRIORITY_BORDER: Record<string, string> = {
  low: "border-l-neutral-200",
  normal: "border-l-blue-300",
  high: "border-l-red-400",
};

const KIND_BG: Record<string, string> = {
  notification: "bg-neutral-100 text-neutral-700",
  reminder: "bg-amber-100 text-amber-800",
};

export function CategoryChip({
  category,
}: {
  category: FeedItemWithRelations["category"];
}) {
  if (!category) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
      style={{
        backgroundColor: `${category.color}20`,
        color: category.color,
        borderColor: `${category.color}40`,
      }}
    >
      {category.icon && <span>{category.icon}</span>}
      {category.name}
    </span>
  );
}

export function FeedCard({
  item,
  engagement,
  showEngagement = false,
  comments,
  currentUserId,
}: {
  item: FeedItemWithRelations;
  engagement?: FeedItemEngagement;
  /** Active les contrôles de lecture/réaction côté employé. */
  showEngagement?: boolean;
  /** Commentaires associés (si fournis, le thread s'affiche). */
  comments?: CommentWithAuthor[];
  currentUserId?: string;
}) {
  const t = getServerDictionary();
  const locale = getLocale();
  const dateFmt = locale === "en" ? "en-US" : "fr-FR";
  const friendly = getDateFormat() === "friendly";
  const isOverdue =
    item.kind === "reminder" &&
    item.due_date &&
    new Date(item.due_date).getTime() < Date.now();

  const authorLabel =
    item.author?.display_name?.trim() || item.author?.email || null;

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-lg border border-neutral-200 border-l-4 bg-white ${
        PRIORITY_BORDER[item.priority] ?? PRIORITY_BORDER.normal
      } ${item.is_pinned ? "ring-1 ring-brand-200" : ""}`}
    >
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt={item.title}
          className="h-40 w-full bg-neutral-100 object-cover sm:h-44"
        />
      )}

      <div className="flex flex-col gap-2 p-4">
        <header className="flex flex-wrap items-center gap-2">
          {item.is_pinned && (
            <span
              title="Épinglé en haut du fil"
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-inset ring-brand-200"
            >
              📌 {t.feed.pinned}
            </span>
          )}
          {item.is_draft && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-200">
              ✏ {t.feed.draft}
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
              KIND_BG[item.kind] ?? KIND_BG.notification
            }`}
          >
            {item.kind === "notification" ? t.feed.notification : item.kind === "reminder" ? t.feed.reminder : item.kind}
          </span>
          <CategoryChip category={item.category} />
          {item.session && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
              🗓 {item.session.name}
            </span>
          )}
          {item.priority === "high" && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
              {t.feed.highPriority}
            </span>
          )}
        </header>

        <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
        {item.body && (
          <div
            className="text-sm leading-relaxed text-neutral-700"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(item.body) }}
          />
        )}

        {item.action_label && item.action_url && (
          <div className="mt-1">
            <a
              href={item.action_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brand-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition"
            >
              {item.action_label}
              <span className="text-xs opacity-80">↗</span>
            </a>
          </div>
        )}

        {showEngagement && engagement && (
          <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-3">
            <ReactionBar
              feedItemId={item.id}
              counts={engagement.reactionCounts}
              myReactions={engagement.myReactions}
            />
            <ReadToggle feedItemId={item.id} isRead={engagement.isRead} />
            <FeedCardActions title={item.title} body={item.body} />
          </div>
        )}

        {comments && currentUserId && (
          <FeedComments
            feedItemId={item.id}
            comments={comments}
            currentUserId={currentUserId}
          />
        )}

        <footer className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span>{t.feed.publishedOn} {formatDateTime(item.published_at, dateFmt, friendly)}</span>
          {authorLabel && (
            <span>
              {t.feed.by} <span className="font-medium text-neutral-700">{authorLabel}</span>
            </span>
          )}
          {item.kind === "reminder" && item.due_date && (
            <span className={isOverdue ? "font-medium text-red-600" : "text-amber-700"}>
              {t.feed.deadline} {formatDateTime(item.due_date, dateFmt, friendly)} {isOverdue && t.feed.overdue}
            </span>
          )}
          {item.expires_at && <span>{t.feed.expiresOn} {formatDateTime(item.expires_at, dateFmt, friendly)}</span>}
          {item.send_channels && item.send_channels.length > 0 && (
            <span className="text-neutral-400">
              · {t.feed.sentAlsoBy} {item.send_channels.map((c) => c.toUpperCase()).join(" + ")}
            </span>
          )}
        </footer>
      </div>
    </article>
  );
}
