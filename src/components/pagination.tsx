import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  /** Extra query params to preserve (e.g., filters) */
  extraParams?: Record<string, string>;
  labels: {
    previous: string;
    next: string;
    showing: string;
  };
  totalItems: number;
  perPage: number;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  extraParams = {},
  labels,
  totalItems,
  perPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  function buildUrl(page: number) {
    const params = new URLSearchParams(extraParams);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  }

  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, totalItems);
  const showingText = labels.showing
    .replace("{from}", String(from))
    .replace("{to}", String(to))
    .replace("{total}", String(totalItems));

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-neutral-500">{showingText}</p>
      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildUrl(currentPage - 1)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            {labels.previous}
          </Link>
        ) : (
          <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 font-medium text-neutral-400 cursor-not-allowed">
            {labels.previous}
          </span>
        )}
        {currentPage < totalPages ? (
          <Link
            href={buildUrl(currentPage + 1)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            {labels.next}
          </Link>
        ) : (
          <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 font-medium text-neutral-400 cursor-not-allowed">
            {labels.next}
          </span>
        )}
      </div>
    </div>
  );
}
