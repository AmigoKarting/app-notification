"use client";

import { Button } from "@/components/ui";
import { deleteEmployeeAction } from "@/domain/employees/actions";

export function DeleteEmployeeForm({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteEmployeeAction}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Supprimer "${name}" ? Tous les rappels associés seront aussi supprimés.`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        Supprimer
      </Button>
    </form>
  );
}
