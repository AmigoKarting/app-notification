"use client";

import { Button } from "@/components/ui";
import { deleteSessionAction } from "@/domain/sessions/actions";

export function DeleteSessionForm({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteSessionAction}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer la session "${name}" ?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        Supprimer
      </Button>
    </form>
  );
}
