"use client";

import { Button } from "@/components/ui";
import { deleteCategoryAction } from "@/domain/categories/actions";
import { useTranslation } from "@/lib/i18n";

export function DeleteCategoryForm({ id, name }: { id: string; name: string }) {
  const { t } = useTranslation();

  return (
    <form
      action={deleteCategoryAction}
      onSubmit={(e) => {
        if (!window.confirm(`${t.dangerZone.confirmDeleteCategory} "${name}" ?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">
        {t.dangerZone.deleteBtn}
      </Button>
    </form>
  );
}
