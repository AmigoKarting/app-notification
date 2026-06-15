import { notFound } from "next/navigation";
import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { getEmployee } from "@/domain/employees/repository";
import { EmployeeForm } from "../employee-form";
import { DeleteEmployeeForm } from "./delete-form";
import { getServerDictionary } from "@/lib/i18n/server";

interface PageProps {
  params: { id: string };
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const t = getServerDictionary();
  const employee = await getEmployee(params.id);
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.name}
        description={t.employees.editDesc}
        action={
          <LinkButton href="/admin/employees" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />

      <Card className="p-6">
        <EmployeeForm mode="edit" employee={employee} />
      </Card>

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="font-medium text-neutral-900">{t.dangerZone.title}</p>
          <p className="text-sm text-neutral-600">
            {t.employees.dangerDesc}
          </p>
        </div>
        <DeleteEmployeeForm id={employee.id} name={employee.name} />
      </Card>

      <PageTip>{t.pageTips.employeeEdit}</PageTip>
    </div>
  );
}
