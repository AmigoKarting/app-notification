"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Stack trace dans la console pour debug, mais on n'expose pas
    // les détails à l'utilisateur côté UI.
    console.error("App error:", error);

    // Reporte vers l'endpoint serveur (qui logue + forward au webhook si configuré).
    // Fire-and-forget — ne bloque jamais le rendu de l'UI d'erreur.
    void fetch("/api/log-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      }),
      // Best-effort: keepalive permet l'envoi même si la page navigue
      keepalive: true,
    }).catch(() => {
      // ignore — déjà loggé en console
    });
  }, [error]);

  return (
    <main className="bg-app-gradient flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-soft-lg">
        <p className="text-5xl">😬</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900">
          Oups, quelque chose a planté
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Une erreur inattendue est survenue. Tu peux réessayer, ou revenir à l'accueil.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-neutral-400">Code : {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="btn-brand-gradient inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
