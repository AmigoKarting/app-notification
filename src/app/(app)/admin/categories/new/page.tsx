import { Card, LinkButton, PageHeader } from "@/components/ui";
import { CategoryForm } from "../category-form";

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle catégorie"
        action={
          <LinkButton href="/admin/categories" variant="secondary">
            Retour
          </LinkButton>
        }
      />
      <Card className="p-6">
        <CategoryForm mode="create" />
      </Card>
    </div>
  );
}
