import { notFound } from "next/navigation";
import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { getTemplate } from "@/domain/templates/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { TemplateForm } from "../template-form";
import { DeleteTemplateForm } from "./delete-form";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function EditTemplatePage({ params }: PageProps) {
  const t = getServerDictionary();
  const [template, categories] = await Promise.all([getTemplate(params.id), listCategories()]);
  if (!template) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        description={t.engagement.templateDescription}
        action={
          <LinkButton href="/admin/templates" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />
      <Card className="p-6">
        <TemplateForm
          mode="edit"
          template={template}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </Card>
      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="font-medium">{t.dangerZone.title}</p>
          <p className="text-sm text-neutral-600">{t.dangerZone.deleteIrreversible}</p>
        </div>
        <DeleteTemplateForm id={template.id} name={template.name} />
      </Card>
      <PageTip>{t.pageTips.adminTemplateEdit}</PageTip>
    </div>
  );
}
