import Link from "next/link";
import { Card, EmptyState, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { listTemplates } from "@/domain/templates/repository";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const t = getServerDictionary();
  const templates = await listTemplates();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminTemplates.title}
        description={t.adminTemplates.description}
        helpHref="/admin/aide/modeles"
        action={<LinkButton href="/admin/templates/new">{t.adminTemplates.newTemplate}</LinkButton>}
      />
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
