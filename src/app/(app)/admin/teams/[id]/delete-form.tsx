"use client";

import { Button } from "@/components/ui";
import { deleteTeamAction } from "@/domain/teams/actions";

export function DeleteTeamForm({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteTeamAction}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer l'équipe "${name}" ?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        Supprimer
      </Button>
    </form>
  );
}
