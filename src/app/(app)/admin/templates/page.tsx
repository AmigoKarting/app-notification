import Link from "next/link";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { listTemplates } from "@/domain/templates/repository";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const templates = await listTemplates();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modèles"
        description="Modèles réutilisables pour gagner du temps. Chargeables dans le formulaire de notification."
        action={<LinkButton href="/admin/templates/new">Nouveau modèle</LinkButton>}
      />

      {templates.length === 0 ? (
        <EmptyState
          title="Aucun modèle"
          description="Crée un modèle pour pré-remplir tes notifications récurrentes."
          action={<LinkButton href="/admin/templates/new">Créer un modèle</LinkButton>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-neutral-100">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900">{t.name}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {t.kind === "reminder" ? "Rappel" : "Notification"} • {t.title}
                  </p>
                </div>
                <Link
                  href={`/admin/templates/${t.id}`}
                  className="text-sm font-medium text-neutral-900 hover:underline"
                >
                  Modifier
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
