import Link from "next/link";
import { LogoMark } from "@/components/ui";
import { getServerDictionary } from "@/lib/i18n/server";

export default function NotFound() {
  const t = getServerDictionary();
  return (
    <main className="bg-app-gradient flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
      <Link href="/" className="mb-8 flex items-center gap-2 transition hover:opacity-80">
        <LogoMark size={32} />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-soft-lg animate-scale-in dark:border-neutral-700 dark:bg-neutral-900">
        <p className="text-6xl font-semibold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          {t.notFound.title}
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {t.notFound.description}
        </p>
        <Link
          href="/"
          className="btn-brand-gradient mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition"
        >
          {t.notFound.backHome}
        </Link>
      </div>
    </main>
  );
}
