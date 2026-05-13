import { notFound } from "next/navigation";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { getTemplate } from "@/domain/templates/repository";
import { TemplateForm } from "../template-form";
import { DeleteTemplateForm } from "./delete-form";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function EditTemplatePage({ params }: PageProps) {
  const [template, categories] = await Promise.all([getTemplate(params.id), listCategories()]);
  if (!template) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        description="Modèle de notification."
        action={
          <LinkButton href="/admin/templates" variant="secondary">
            Retour
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
          <p className="font-medium">Zone de danger</p>
          <p className="text-sm text-neutral-600">La suppression est irréversible.</p>
        </div>
        <DeleteTemplateForm id={template.id} name={template.name} />
      </Card>
    </div>
  );
}
