"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkDeleteFeedItemsAction } from "@/domain/feed/actions";
import { useTranslation } from "@/lib/i18n";

interface BulkActionsProps {
  itemIds: string[];
}

export function BulkActions({ itemIds }: BulkActionsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const allSelected = selected.size === itemIds.length && itemIds.length > 0;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(itemIds));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(t.adminFeed.bulkDeleteConfirm.replace("{count}", String(selected.size)))) return;
    startTransition(async () => {
      await bulkDeleteFeedItemsAction([...selected]);
      setSelected(new Set());
      router.refresh();
    });
  }

  return { selected, allSelected, pending, toggleAll, toggle, handleBulkDelete };
}

export function BulkBar({
  count,
  onDelete,
  pending,
}: {
  count: number;
  onDelete: () => void;
  pending: boolean;
}) {
  const { t } = useTranslation();
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm dark:border-brand-700 dark:bg-brand-950/30">
      <span className="font-medium text-brand-800 dark:text-brand-300">
        {count} {t.adminFeed.bulkSelected}
      </span>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? "..." : t.common.delete}
      </button>
    </div>
  );
}

export function SelectCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500 dark:border-neutral-600 dark:bg-neutral-800"
    />
  );
}
