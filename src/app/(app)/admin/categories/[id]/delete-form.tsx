"use client";

import { Button } from "@/components/ui";
import { deleteCategoryAction } from "@/domain/categories/actions";

export function DeleteCategoryForm({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteCategoryAction}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer la catégorie "${name}" ?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        Supprimer
      </Button>
    </form>
  );
}
