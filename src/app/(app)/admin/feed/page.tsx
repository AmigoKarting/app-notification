import Link from "next/link";
import { Card, EmptyState, LinkButton, PageHeader, PageTip, formatDateTime } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { CategoryChip } from "@/components/feed-card";
import { duplicateFeedItemAction, toggleFeedItemPinAction } from "@/domain/feed/actions";
import { listFeedItems } from "@/domain/feed/repository";
import { listProfilesWithEmail } from "@/domain/users/repository";
import type { FeedItemKind } from "@/lib/supabase/database.types";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";
import { AuthorFilter } from "./author-filter";

export const dynamic = "force-dynamic";

const KINDS: FeedItemKind[] = ["notification", "reminder"];

const PER_PAGE = 20;

interface PageProps {
  searchParams?: { kind?: string; q?: string; author?: string; page?: string };
}

export default async function AdminFeedPage({ searchParams }: PageProps) {
  const t = getServerDictionary();
  const locale = getLocale();
  const dateFmt = locale === "en" ? "en-US" : "fr-FR";
  const kind =
    searchParams?.kind && (KINDS as string[]).includes(searchParams.kind)
      ? (searchParams.kind as FeedItemKind)
      : undefined;
  const search = searchParams?.q?.trim() ?? "";
  const authorId = searchParams?.author?.trim() || undefined;
  const page = Math.max(1, Number(searchParams?.page) || 1);

  const [allItems, authors] = await Promise.all([
    listFeedItems({
      kind,
      search: search || undefined,
      authorId,
      limit: 1000,
    }),
    listProfilesWithEmail(),
  ]);
  const devs = authors.filter((a) => a.role === "dev");
  const totalPages = Math.ceil(allItems.length / PER_PAGE);
  const items = allItems.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Build extra params for pagination links
  const paginationParams: Record<string, string> = {};
  if (kind) paginationParams.kind = kind;
  if (search) paginationParams.q = search;
  if (authorId) paginationParams.author = authorId;

  // Conserve le filtre kind dans l'URL de recherche
  const baseParams = new URLSearchParams();
  if (kind) baseParams.set("kind", kind);
  const baseQs = baseParams.toString();
  const filterHref = (k?: FeedItemKind) => {
    const p = new URLSearchParams();
    if (k) p.set("kind", k);
    if (search) p.set("q", search);
    const qs = p.toString();
    return qs ? `/admin/feed?${qs}` : "/admin/feed";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminFeed.title}
        description={t.adminFeed.description}
        helpHref="/admin/aide/envoyer-notification"
        action={<LinkButton href="/admin/feed/new">{t.adminFeed.newItem}</LinkButton>}
      />
      {/* Barre de recherche */}
      <form
        action="/admin/feed"
        method="get"
        className="flex flex-wrap items-center gap-2"
      >
        {kind && <input type="hidden" name="kind" value={kind} />}
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder={t.adminFeed.searchPlaceholder}
          className="w-full max-w-md rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {search && (
          <Link
            href={baseQs ? `/admin/feed?${baseQs}` : "/admin/feed"}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
          >
            {t.common.clear}
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        <Filter href={filterHref(undefined)} active={!kind} label={t.adminFeed.all} />
        <Filter
          href={filterHref("notification")}
          active={kind === "notification"}
          label={t.adminFeed.notifications}
        />
        <Filter
          href={filterHref("reminder")}
          active={kind === "reminder"}
          label={t.adminFeed.reminders}
        />
        <AuthorFilter
          authors={devs.map((d) => ({
            id: d.id,
            label: d.display_name?.trim() || d.email || d.id.slice(0, 8),
          }))}
          currentAuthorId={authorId}
          currentKind={kind}
          currentSearch={search || undefined}
        />
      </div>

      {allItems.length === 0 ? (
        <EmptyState
          title={search ? t.adminFeed.noResults : t.adminFeed.noItems}
          description={
            search
              ? t.adminFeed.noResultsDesc
              : t.adminFeed.noItemsDesc
          }
          action={
            !search && <LinkButton href="/admin/feed/new">{t.adminFeed.newItem}</LinkButton>
          }
        />
      ) : (
        <>
          {search && (
            <p className="text-xs text-neutral-500">
              {allItems.length} {allItems.length > 1 ? t.adminFeed.resultsPlural : t.adminFeed.results} {t.adminFeed.forQuery} {search} »
            </p>
          )}
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {items.map((it) => (
              <Card key={it.id} className="p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  {it.is_pinned && (
                    <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-700 ring-1 ring-brand-200">
                      📌 {t.feed.pinned}
                    </span>
                  )}
                  {it.is_draft && (
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 ring-1 ring-amber-200">
                      ✏ {t.feed.draft}
                    </span>
                  )}
                  <span className="text-xs capitalize text-neutral-500">
                    {it.kind === "reminder" ? t.feed.reminder : t.feed.notification}
                  </span>
                  <CategoryChip category={it.category} />
                </div>
                <p className="mt-1 font-medium text-neutral-900">{it.title}</p>
                {it.priority === "high" && (
                  <span className="text-xs text-red-600">{t.feed.highPriority}</span>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">{formatDateTime(it.published_at, dateFmt)}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <form action={toggleFeedItemPinAction}>
                      <input type="hidden" name="id" value={it.id} />
                      <input type="hidden" name="is_pinned" value={String(it.is_pinned)} />
                      <button type="submit" className={`hover:underline ${it.is_pinned ? "text-brand-700" : "text-neutral-500"}`}>
                        📌
                      </button>
                    </form>
                    <form action={duplicateFeedItemAction}>
                      <input type="hidden" name="id" value={it.id} />
                      <button type="submit" className="text-neutral-500 hover:text-neutral-900">📋</button>
                    </form>
                    <Link href={`/admin/feed/${it.id}`} className="font-medium text-brand-700 hover:underline">
                      {t.adminFeed.edit}
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: table layout */}
          <Card className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{t.adminFeed.titleHeader}</th>
                  <th className="px-4 py-2 font-medium">{t.adminFeed.typeHeader}</th>
                  <th className="px-4 py-2 font-medium">{t.adminFeed.categoryHeader}</th>
                  <th className="px-4 py-2 font-medium">{t.adminFeed.sessionHeader}</th>
                  <th className="px-4 py-2 font-medium">{t.adminFeed.publishedHeader}</th>
                  <th className="px-4 py-2 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-neutral-50">
                    <td className="max-w-md px-4 py-3 align-top">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {it.is_pinned && (
                          <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-700 ring-1 ring-brand-200">
                            📌 {t.feed.pinned}
                          </span>
                        )}
                        {it.is_draft && (
                          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 ring-1 ring-amber-200">
                            ✏ {t.feed.draft}
                          </span>
                        )}
                        <p className="truncate font-medium text-neutral-900">{it.title}</p>
                      </div>
                      {it.priority === "high" && (
                        <span className="text-xs text-red-600">{t.feed.highPriority}</span>
                      )}
                      {it.send_channels && it.send_channels.length > 0 && (
                        <span className="block text-xs text-neutral-400">
                          + {it.send_channels.map((c) => c.toUpperCase()).join(", ")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top capitalize">
                      {it.kind === "reminder" ? t.feed.reminder : t.feed.notification}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <CategoryChip category={it.category} />
                    </td>
                    <td className="px-4 py-3 align-top text-neutral-700">
                      {it.session?.name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-neutral-700">
                      {formatDateTime(it.published_at, dateFmt)}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <div className="flex justify-end gap-3 text-sm">
                        <form action={toggleFeedItemPinAction}>
                          <input type="hidden" name="id" value={it.id} />
                          <input type="hidden" name="is_pinned" value={String(it.is_pinned)} />
                          <button
                            type="submit"
                            className={`font-medium hover:underline ${
                              it.is_pinned ? "text-brand-700" : "text-neutral-500"
                            }`}
                            title={it.is_pinned ? t.adminFeed.unpin : t.adminFeed.pin}
                          >
                            📌
                          </button>
                        </form>
                        <form action={duplicateFeedItemAction}>
                          <input type="hidden" name="id" value={it.id} />
                          <button
                            type="submit"
                            className="font-medium text-neutral-500 hover:text-neutral-900 hover:underline"
                            title={t.adminFeed.duplicate}
                          >
                            📋
                          </button>
                        </form>
                        <Link
                          href={`/admin/feed/${it.id}`}
                          className="font-medium text-neutral-900 hover:underline"
                        >
                          {t.adminFeed.edit}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/admin/feed"
            extraParams={paginationParams}
            labels={t.pagination}
            totalItems={allItems.length}
            perPage={PER_PAGE}
          />
        </>
      )}
      <PageTip>{t.pageTips.adminFeed}</PageTip>
    </div>
  );
}

function Filter({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 transition ${
        active
          ? "bg-neutral-900 text-white"
          : "border border-neutral-200 bg-white hover:bg-neutral-50"
      }`}
    >
      {label}
    </Link>
  );
}
