import Link from "next/link";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { listEmployees } from "@/domain/employees/repository";
import { ReminderForm } from "../reminder-form";

export const dynamic = "force-dynamic";

export default async function NewReminderPage() {
  const employees = await listEmployees({ limit: 500 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau rappel"
        description="Planifie un message à envoyer à un employé."
        action={
          <LinkButton href="/reminders" variant="secondary">
            Retour
          </LinkButton>
        }
      />

      {employees.length === 0 ? (
        <EmptyState
          title="Aucun employé"
          description="Crée d'abord un employé avant de pouvoir lui envoyer un rappel."
          action={<LinkButton href="/employees/new">Ajouter un employé</LinkButton>}
        />
      ) : (
        <Card className="p-6">
          <ReminderForm
            mode="create"
            employees={employees.map((e) => ({ id: e.id, name: e.name }))}
          />
        </Card>
      )}
    </div>
  );
}
