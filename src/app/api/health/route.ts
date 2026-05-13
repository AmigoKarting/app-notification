import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint de healthcheck pour le monitoring externe (uptime monitors,
 * load balancers, Vercel checks). Renvoie 200 si Supabase répond,
 * 503 sinon. Pas de données sensibles exposées.
 */
export async function GET() {
  const startedAt = Date.now();
  let supabaseOk = false;
  let supabaseError: string | null = null;

  try {
    const supabase = createClient();
    // Requête triviale qui valide l'accès DB.
    const { error } = await supabase
      .from("app_settings")
      .select("id", { head: true, count: "exact" })
      .limit(1);
    if (error) {
      supabaseError = error.message;
    } else {
      supabaseOk = true;
    }
  } catch (err) {
    supabaseError = err instanceof Error ? err.message : "unknown";
  }

  const body = {
    status: supabaseOk ? "ok" : "degraded",
    checks: {
      supabase: supabaseOk ? "ok" : "fail",
    },
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
    ...(supabaseError && { details: { supabase: supabaseError } }),
  };

  return NextResponse.json(body, {
    status: supabaseOk ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
