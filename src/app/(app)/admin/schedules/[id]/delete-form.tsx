"use client";

import { Button } from "@/components/ui";
import { deleteScheduleAction } from "@/domain/notification-schedules/actions";

export function DeleteScheduleForm({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteScheduleAction}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer la planification "${title}" ?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        Supprimer
      </Button>
    </form>
  );
}
