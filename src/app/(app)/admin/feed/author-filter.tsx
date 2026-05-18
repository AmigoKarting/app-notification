"use client";

import { useTranslation } from "@/lib/i18n";

interface Props {
  authors: Array<{ id: string; label: string }>;
  currentAuthorId?: string;
  currentKind?: string;
  currentSearch?: string;
}

export function AuthorFilter({ authors, currentAuthorId, currentKind, currentSearch }: Props) {
  const { t } = useTranslation();
  if (authors.length <= 1) return null;
  return (
    <form action="/admin/feed" method="get" className="ml-auto">
      {currentKind && <input type="hidden" name="kind" value={currentKind} />}
      {currentSearch && <input type="hidden" name="q" value={currentSearch} />}
      <select
        name="author"
        defaultValue={currentAuthorId ?? ""}
        onChange={(e) => e.currentTarget.form?.submit()}
        className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm outline-none focus:border-brand-500"
      >
        <option value="">{t.authorFilter.allAuthors}</option>
        {authors.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
    </form>
  );
}
