"use client";

import { Button } from "@/components/ui";
import { deleteEmployeeAction } from "@/domain/employees/actions";
import { useTranslation } from "@/lib/i18n";

export function DeleteEmployeeForm({ id, name }: { id: string; name: string }) {
  const { t } = useTranslation();
  return (
    <form
      action={deleteEmployeeAction}
      onSubmit={(e) => {
        const ok = window.confirm(
          t.employees.deleteConfirm.replace("{name}", name),
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        {t.employees.deleteBtn}
      </Button>
    </form>
  );
}
