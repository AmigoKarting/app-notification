import { NextResponse } from "next/server";
import { dispatchReminders } from "@/domain/reminders/dispatcher";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Compare deux strings en temps constant pour éviter le timing-attack
 * sur le secret du cron.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error("cron.misconfigured", { reason: "CRON_SECRET not set" });
    return false;
  }
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return timingSafeEqual(header, expected);
}

async function handle(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await dispatchReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    logger.error("cron.dispatch.failed", { error: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// Vercel Cron envoie GET. cron-job.org / GitHub Actions peuvent envoyer POST.
// On supporte les deux pour rester souple.
export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
