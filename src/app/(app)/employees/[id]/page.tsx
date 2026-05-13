import { notFound } from "next/navigation";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { getEmployee } from "@/domain/employees/repository";
import { EmployeeForm } from "../employee-form";
import { DeleteEmployeeForm } from "./delete-form";

interface PageProps {
  params: { id: string };
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const employee = await getEmployee(params.id);
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.name}
        description="Modifier les informations de l'employé."
        action={
          <LinkButton href="/employees" variant="secondary">
            Retour
          </LinkButton>
        }
      />

      <Card className="p-6">
        <EmployeeForm mode="edit" employee={employee} />
      </Card>

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="font-medium text-neutral-900">Zone de danger</p>
          <p className="text-sm text-neutral-600">
            La suppression est irréversible et entraîne la suppression des rappels associés.
          </p>
        </div>
        <DeleteEmployeeForm id={employee.id} name={employee.name} />
      </Card>
    </div>
  );
}
