import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint de healthcheck — exclut du middleware, donc toujours accessible.
 * Diagnostique les variables d'environnement et la connexion Supabase.
 */
export async function GET() {
  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `set (${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...)`
      : "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `set (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...)`
      : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "set"
      : "MISSING (optional)",
    CRON_SECRET: process.env.CRON_SECRET ? "set" : "MISSING",
  };

  let supabaseOk = false;
  let supabaseError: string | null = null;

  try {
    // Import dynamique pour éviter un crash si les env vars manquent
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
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
    env: envStatus,
    supabase: supabaseOk ? "ok" : supabaseError,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: supabaseOk ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
