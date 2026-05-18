import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { TemplateForm } from "../template-form";

export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
  const t = getServerDictionary();
  const categories = await listCategories();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminTemplates.newTemplate}
        action={
          <LinkButton href="/admin/templates" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />
      <Card className="p-6">
        <TemplateForm
          mode="create"
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </Card>
      <PageTip>{t.pageTips.adminTemplateNew}</PageTip>
    </div>
  );
}
