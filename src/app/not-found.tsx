import Link from "next/link";
import { LogoMark } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="bg-app-gradient flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
      <Link href="/" className="mb-8 flex items-center gap-2 transition hover:opacity-80">
        <LogoMark size={32} />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-soft-lg">
        <p className="text-6xl font-semibold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          La page que tu cherches n'existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="btn-brand-gradient mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition"
        >
          Retour à l'accueil
        </Link>
      </div>
    </main>
  );
}
