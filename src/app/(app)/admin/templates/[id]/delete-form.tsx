"use client";

import { Button } from "@/components/ui";
import { deleteTemplateAction } from "@/domain/templates/actions";
import { useTranslation } from "@/lib/i18n";

export function DeleteTemplateForm({ id, name }: { id: string; name: string }) {
  const { t } = useTranslation();

  return (
    <form
      action={deleteTemplateAction}
      onSubmit={(e) => {
        if (!window.confirm(`${t.dangerZone.confirmDeleteTemplate} "${name}" ?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        {t.dangerZone.deleteBtn}
      </Button>
    </form>
  );
}
