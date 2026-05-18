"use client";

import { useTranslation } from "@/lib/i18n";

/**
 * Error boundary for the (app) layout group.
 * Shows the actual error message instead of the generic Next.js production message.
 * TODO: Remove this file once the crash is diagnosed and fixed.
 */
export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-red-600">{t.errors.errorTitle}</h1>
      <p className="mt-4 text-sm text-neutral-700">
        {t.errors.errorDescription}
      </p>
      <pre className="mt-4 rounded-lg bg-red-50 p-4 text-left text-xs text-red-800 whitespace-pre-wrap break-words">
        {error.message || t.errors.noErrorMessage}
      </pre>
      {error.digest && (
        <p className="mt-2 text-xs text-neutral-500">Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        {t.common.retry}
      </button>
    </div>
  );
}
