"use client";

import { Button } from "@/components/ui";
import { deleteReminderAction } from "@/domain/reminders/actions";

export function DeleteReminderForm({ id }: { id: string }) {
  return (
    <form
      action={deleteReminderAction}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer ce rappel ? Cette action est irréversible.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        Supprimer
      </Button>
    </form>
  );
}
