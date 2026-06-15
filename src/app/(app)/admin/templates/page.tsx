import Link from "next/link";
import { Card, EmptyState, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { listTemplates } from "@/domain/templates/repository";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: { q?: string };
}

export default async function AdminTemplatesPage({ searchParams }: PageProps) {
  const t = getServerDictionary();
  const search = searchParams?.q?.trim() || undefined;
  const templates = await listTemplates({ search });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminTemplates.title}
        description={t.adminTemplates.description}
        helpHref="/admin/aide/modeles"
        action={<LinkButton href="/admin/templates/new">{t.adminTemplates.newTemplate}</LinkButton>}
      />

      <form action="/admin/templates" method="get" className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={search ?? ""}
          placeholder={t.common.searchPlaceholder}
          className="w-full max-w-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-brand-500 dark:focus:ring-brand-800"
        />
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600">
          {t.common.search}
        </button>
        {search && (
          <Link href="/admin/templates" className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
            {t.common.clear}
          </Link>
        )}
      </form>

      {templates.length === 0 ? (
        <EmptyState
          title={t.adminTemplates.noTemplates}
          description={t.adminTemplates.noTemplatesDesc}
          action={<LinkButton href="/admin/templates/new">{t.adminTemplates.createTemplate}</LinkButton>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-neutral-100">
            {templates.map((tmpl) => (
              <li key={tmpl.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900">{tmpl.name}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {tmpl.kind === "reminder" ? t.feed.reminder : t.feed.notification} • {tmpl.title}
                  </p>
                </div>
                <Link
                  href={`/admin/templates/${tmpl.id}`}
                  className="text-sm font-medium text-neutral-900 hover:underline"
                >
                  {t.adminTemplates.edit}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <PageTip>{t.pageTips.adminTemplates}</PageTip>
    </div>
  );
}
