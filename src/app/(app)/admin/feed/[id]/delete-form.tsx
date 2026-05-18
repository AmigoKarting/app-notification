"use client";

import { Button } from "@/components/ui";
import { deleteFeedItemAction } from "@/domain/feed/actions";
import { useTranslation } from "@/lib/i18n";

export function DeleteFeedItemForm({ id }: { id: string }) {
  const { t } = useTranslation();

  return (
    <form
      action={deleteFeedItemAction}
      onSubmit={(e) => {
        if (!window.confirm(t.dangerZone.confirmDeleteFeedItem)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        {t.dangerZone.deleteBtn}
      </Button>
    </form>
  );
}
