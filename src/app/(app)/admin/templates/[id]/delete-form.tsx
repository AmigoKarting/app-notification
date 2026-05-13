"use client";

import { Button } from "@/components/ui";
import { deleteTemplateAction } from "@/domain/templates/actions";

export function DeleteTemplateForm({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteTemplateAction}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer le modèle "${name}" ?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        Supprimer
      </Button>
    </form>
  );
}
