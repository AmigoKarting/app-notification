import { Card, LinkButton, PageHeader } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { TemplateForm } from "../template-form";

export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
  const categories = await listCategories();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau modèle"
        action={
          <LinkButton href="/admin/templates" variant="secondary">
            Retour
          </LinkButton>
        }
      />
      <Card className="p-6">
        <TemplateForm
          mode="create"
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </Card>
    </div>
  );
}
