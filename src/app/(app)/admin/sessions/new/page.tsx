import { Card, EmptyState, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { SessionForm } from "../session-form";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const t = getServerDictionary();
  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminSessions.newSession}
        action={
          <LinkButton href="/admin/sessions" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />
      {categories.length === 0 ? (
        <EmptyState
          title={t.adminSessions.noCategoryForSession}
          description={t.adminSessions.noCategoryForSessionDesc}
          action={<LinkButton href="/admin/categories/new">{t.adminSessions.createCategory}</LinkButton>}
        />
      ) : (
        <Card className="p-6">
          <SessionForm
            mode="create"
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          />
        </Card>
      )}
      <PageTip>{t.pageTips.adminSessionNew}</PageTip>
    </div>
  );
}
