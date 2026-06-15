import Link from "next/link";
import { EmptyState, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { listFeedItems } from "@/domain/feed/repository";
import { listProfilesWithEmail } from "@/domain/users/repository";
import type { FeedItemKind } from "@/lib/supabase/database.types";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";
import { AuthorFilter } from "./author-filter";
import { FeedTable } from "./feed-table";

export const dynamic = "force-dynamic";

const KINDS: FeedItemKind[] = ["notification", "reminder"];

const PER_PAGE = 20;

const SORTS = ["date_desc", "date_asc", "priority", "title"] as const;
type SortKey = (typeof SORTS)[number];

interface PageProps {
  searchParams?: { kind?: string; q?: string; author?: string; page?: string; sort?: string };
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
  const sort: SortKey = (SORTS as readonly string[]).includes(searchParams?.sort ?? "")
    ? (searchParams!.sort as SortKey)
    : "date_desc";
  const page = Math.max(1, Number(searchParams?.page) || 1);

  const [allItems, authors] = await Promise.all([
    listFeedItems({
      kind,
      search: search || undefined,
      authorId,
      sort: sort === "date_desc" ? undefined : sort,
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
  if (sort !== "date_desc") paginationParams.sort = sort;

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
        <span className="mx-1 text-neutral-300">|</span>
        {SORTS.map((s) => {
          const p = new URLSearchParams();
          if (kind) p.set("kind", kind);
          if (search) p.set("q", search);
          if (authorId) p.set("author", authorId);
          if (s !== "date_desc") p.set("sort", s);
          const qs = p.toString();
          return (
            <Filter
              key={s}
              href={qs ? `/admin/feed?${qs}` : "/admin/feed"}
              active={sort === s}
              label={t.adminFeed[`sort_${s}` as keyof typeof t.adminFeed] as string}
            />
          );
        })}
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
          <FeedTable items={items} dateFmt={dateFmt} />

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
