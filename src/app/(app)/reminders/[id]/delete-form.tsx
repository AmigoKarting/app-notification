"use client";

import { Button } from "@/components/ui";
import { deleteReminderAction } from "@/domain/reminders/actions";
import { useTranslation } from "@/lib/i18n";

export function DeleteReminderForm({ id }: { id: string }) {
  const { t } = useTranslation();
  return (
    <form
      action={deleteReminderAction}
      onSubmit={(e) => {
        if (!window.confirm(t.reminders.deleteConfirm)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        {t.reminders.deleteBtn}
      </Button>
    </form>
  );
}
