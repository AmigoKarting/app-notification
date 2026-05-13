import { Card, LinkButton, PageHeader } from "@/components/ui";
import { EmployeeForm } from "../employee-form";

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvel employé"
        description="Renseigne les informations de l'employé."
        action={
          <LinkButton href="/employees" variant="secondary">
            Retour
          </LinkButton>
        }
      />

      <Card className="p-6">
        <EmployeeForm mode="create" />
      </Card>
    </div>
  );
}
