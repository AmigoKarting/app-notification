"use client";

import { Button } from "@/components/ui";
import { deleteFeedItemAction } from "@/domain/feed/actions";

export function DeleteFeedItemForm({ id }: { id: string }) {
  return (
    <form
      action={deleteFeedItemAction}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer cet élément ?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        Supprimer
      </Button>
    </form>
  );
}
