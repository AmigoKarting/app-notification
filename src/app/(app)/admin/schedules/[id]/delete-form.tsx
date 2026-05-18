"use client";

import { Button } from "@/components/ui";
import { deleteScheduleAction } from "@/domain/notification-schedules/actions";
import { useTranslation } from "@/lib/i18n";

export function DeleteScheduleForm({ id, title }: { id: string; title: string }) {
  const { t } = useTranslation();

  return (
    <form
      action={deleteScheduleAction}
      onSubmit={(e) => {
        if (!window.confirm(`${t.dangerZone.confirmDeleteSchedule}\n"${title}"`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        {t.dangerZone.deleteBtn}
      </Button>
    </form>
  );
}
