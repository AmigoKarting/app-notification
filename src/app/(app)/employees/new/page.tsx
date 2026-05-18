import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { EmployeeForm } from "../employee-form";
import { getServerDictionary } from "@/lib/i18n/server";

export default function NewEmployeePage() {
  const t = getServerDictionary();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t.employees.newTitle}
        description={t.employees.newDesc}
        action={
          <LinkButton href="/employees" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />

      <Card className="p-6">
        <EmployeeForm mode="create" />
      </Card>

      <PageTip>{t.pageTips.employeeNew}</PageTip>
    </div>
  );
}
