import "server-only";

import { logger } from "@/lib/logger";

export interface ReportedError {
  message: string;
  stack?: string;
  digest?: string;
  url?: string;
  userId?: string | null;
  scope?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Reporte une erreur applicative.
 *
 * Comportement :
 *  - Toujours loggée en JSON structuré (visible dans Vercel Logs).
 *  - Si `ERROR_WEBHOOK_URL` est défini, l'erreur est aussi POSTée à
 *    cette URL — compatible avec Discord/Slack webhooks, Sentry HTTP
 *    relay, Axiom, Logsnag, etc. Pas de dépendance, pas de SDK.
 *
 * Best-effort: l'envoi du webhook n'est pas attendu (fire-and-forget)
 * et toute erreur réseau est avalée — l'observabilité ne doit jamais
 * bloquer la fonctionnalité.
 */
export function reportError(payload: ReportedError): void {
  logger.error(payload.scope ?? "app.error", {
    message: payload.message,
    stack: payload.stack?.split("\n").slice(0, 5).join("\n"),
    digest: payload.digest,
    url: payload.url,
    userId: payload.userId,
    ...(payload.metadata ?? {}),
  });

  const webhookUrl = process.env.ERROR_WEBHOOK_URL;
  if (!webhookUrl) return;

  // Fire-and-forget
  void fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ts: new Date().toISOString(),
      app: appShortName(),
      ...payload,
    }),
  }).catch((err) => {
    logger.warn("error_reporter.webhook.failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  });
}

function appShortName(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const match = url.match(/\/\/([^.]+)/);
  return match?.[1] ?? "app";
}
