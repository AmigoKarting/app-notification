import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { SessionForm } from "../session-form";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const categories = await listCategories();
  const editable = categories; // RLS filtre déjà : on ne voit ici que celles qu'on possède en écriture

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle session"
        action={
          <LinkButton href="/admin/sessions" variant="secondary">
            Retour
          </LinkButton>
        }
      />

      {editable.length === 0 ? (
        <EmptyState
          title="Aucune catégorie"
          description="Crée d'abord une catégorie : une session vit toujours dans une catégorie."
          action={<LinkButton href="/admin/categories/new">Créer une catégorie</LinkButton>}
        />
      ) : (
        <Card className="p-6">
          <SessionForm
            mode="create"
            categories={editable.map((c) => ({ id: c.id, name: c.name }))}
          />
        </Card>
      )}
    </div>
  );
}
