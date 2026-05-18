"use client";

import { Button } from "@/components/ui";
import { deleteSessionAction } from "@/domain/sessions/actions";
import { useTranslation } from "@/lib/i18n";

export function DeleteSessionForm({ id, name }: { id: string; name: string }) {
  const { t } = useTranslation();

  return (
    <form
      action={deleteSessionAction}
      onSubmit={(e) => {
        if (!window.confirm(`${t.dangerZone.confirmDeleteSession} "${name}" ?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        {t.dangerZone.deleteBtn}
      </Button>
    </form>
  );
}
