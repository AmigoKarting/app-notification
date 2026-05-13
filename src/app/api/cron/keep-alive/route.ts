import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Empêche le projet Supabase de tomber en veille (free tier = pause après
 * 7 jours sans requête). Exécute une lecture minimale sur app_settings
 * (1 ligne, ~quelques octets) ce qui suffit pour maintenir le projet actif.
 *
 * Endpoint volontairement PUBLIC :
 *  - Aucune donnée sensible exposée
 *  - Aucun side-effect côté DB
 *  - Permet d'être appelé par n'importe quel cron externe (Vercel Cron,
 *    cron-job.org, GitHub Actions, UptimeRobot...) sans gestion de secret
 *
 * Sécurité: si tu veux limiter l'accès, mets devant un firewall (Vercel
 * WAF / Cloudflare) ou ajoute un check du Bearer CRON_SECRET ici.
 *
 * Fréquence recommandée: 1 fois par jour. Au minimum 1 fois tous les 6 jours.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("app_settings")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    const durationMs = Date.now() - startedAt;

    if (error) {
      logger.warn("keep-alive.failed", { error: error.message, durationMs });
      return NextResponse.json(
        { status: "error", error: error.message, durationMs },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    logger.info("keep-alive.ok", { durationMs });
    return NextResponse.json(
      {
        status: "alive",
        durationMs,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    logger.error("keep-alive.crashed", { error: message });
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
