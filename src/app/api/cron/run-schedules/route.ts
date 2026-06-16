import { NextResponse } from "next/server";
import { dispatchSchedules } from "@/domain/notification-schedules/worker";
import { dispatchReminders } from "@/domain/reminders/dispatcher";
import { dispatchAutoNotifications } from "@/domain/auto-notifications/engine";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/**
 * Endpoint combiné : exécute les planifications récurrentes ET les rappels
 * en un seul appel. Permet de n'utiliser qu'un seul cron Vercel.
 *
 * Pour des exécutions fréquentes (toutes les minutes), utilise un cron
 * externe gratuit (cron-job.org, UptimeRobot, GitHub Actions…) qui
 * appelle cet endpoint en GET/POST avec le header Authorization: Bearer <CRON_SECRET>.
 */
async function handle(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // 1. Planifications récurrentes
  try {
    results.schedules = await dispatchSchedules();
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    logger.error("cron.schedules.failed", { error: message });
    results.schedules = { ok: false, error: message };
  }

  // 2. Rappels par email (legacy)
  try {
    results.reminders = await dispatchReminders();
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    logger.error("cron.reminders.failed", { error: message });
    results.reminders = { ok: false, error: message };
  }

  // 3. Notifications automatiques superviseur (horaires saisonniers)
  try {
    results.autoNotifications = await dispatchAutoNotifications();
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    logger.error("cron.auto-notifications.failed", { error: message });
    results.autoNotifications = { ok: false, error: message };
  }

  return NextResponse.json({ ok: true, ...results });
}

// Vercel Cron envoie GET. cron-job.org / GitHub Actions peuvent envoyer POST.
export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
