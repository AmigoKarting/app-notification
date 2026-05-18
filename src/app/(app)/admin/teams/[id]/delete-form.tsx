"use client";

import { Button } from "@/components/ui";
import { deleteTeamAction } from "@/domain/teams/actions";
import { useTranslation } from "@/lib/i18n";

export function DeleteTeamForm({ id, name }: { id: string; name: string }) {
  const { t } = useTranslation();

  return (
    <form
      action={deleteTeamAction}
      onSubmit={(e) => {
        if (!window.confirm(`${t.dangerZone.confirmDeleteTeam} "${name}" ?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        {t.dangerZone.deleteBtn}
      </Button>
    </form>
  );
}
