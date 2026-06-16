import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/messaging/notify";
import { logger } from "@/lib/logger";

const TZ = "America/Montreal";

interface Season {
  id: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
}

interface BusinessHours {
  open_time: string;
  close_time: string;
}

interface AutoNotification {
  id: string;
  name: string;
  trigger_type: "opening" | "fixed_time" | "closing";
  trigger_time: string | null;
  offset_minutes: number;
  title: string;
  body: string;
  target_role: string;
}

function nowInMontreal(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function findSeason(seasons: Season[], month: number, day: number): Season | null {
  for (const s of seasons) {
    const startVal = s.start_month * 100 + s.start_day;
    const endVal = s.end_month * 100 + s.end_day;
    const curVal = month * 100 + day;
    if (curVal >= startVal && curVal <= endVal) return s;
  }
  return null;
}

async function sendToRole(supabase: any, role: string, title: string, body: string, sourceId: string) {
  const { data: targets } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", role);
  if (!targets || targets.length === 0) return 0;

  for (const target of targets) {
    await notify({
      channels: ["push"],
      recipient: { userId: target.id },
      message: { subject: title, body },
      context: { source: "auto-notification", sourceId },
    });
  }
  return targets.length;
}

// ═══════════════════════════════════════════
// 1. Seasonal auto-notifications (opening, 20h, closing)
// ═══════════════════════════════════════════

export async function dispatchAutoNotifications(): Promise<{
  ok: boolean;
  sent: number;
  skipped: number;
}> {
  const supabase = createAdminClient();
  const now = nowInMontreal();
  const todayStr = dateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const dayOfWeek = now.getDay();

  const { data: seasons } = await (supabase as any)
    .from("business_seasons")
    .select("id, start_month, start_day, end_month, end_day");
  if (!seasons || seasons.length === 0) return { ok: true, sent: 0, skipped: 0 };

  const season = findSeason(seasons as Season[], month, day);
  if (!season) return { ok: true, sent: 0, skipped: 0 };

  const { data: holidays } = await (supabase as any)
    .from("business_holidays")
    .select("date")
    .eq("date", todayStr);
  const isHoliday = holidays && holidays.length > 0;

  const lookupDow = isHoliday ? 7 : dayOfWeek;
  const { data: hoursRows } = await (supabase as any)
    .from("business_hours")
    .select("open_time, close_time")
    .eq("season_id", season.id)
    .eq("day_of_week", lookupDow)
    .limit(1);

  if (!hoursRows || hoursRows.length === 0) return { ok: true, sent: 0, skipped: 0 };

  const hours = hoursRows[0] as BusinessHours;
  const openMinutes = timeToMinutes(hours.open_time);
  const closeMinutes = timeToMinutes(hours.close_time);

  const { data: notifs } = await (supabase as any)
    .from("auto_notifications")
    .select("id, name, trigger_type, trigger_time, offset_minutes, title, body, target_role")
    .eq("is_active", true);
  if (!notifs || notifs.length === 0) return { ok: true, sent: 0, skipped: 0 };

  const notifIds = (notifs as AutoNotification[]).map((n) => n.id);
  const { data: logs } = await (supabase as any)
    .from("auto_notification_log")
    .select("notification_id")
    .eq("date", todayStr)
    .in("notification_id", notifIds);
  const sentSet = new Set((logs ?? []).map((l: any) => l.notification_id));

  let sent = 0;
  let skipped = 0;

  for (const notif of notifs as AutoNotification[]) {
    if (sentSet.has(notif.id)) { skipped++; continue; }

    let triggerMinutes: number;
    switch (notif.trigger_type) {
      case "opening": triggerMinutes = openMinutes + notif.offset_minutes; break;
      case "closing": triggerMinutes = closeMinutes + notif.offset_minutes; break;
      case "fixed_time": triggerMinutes = notif.trigger_time ? timeToMinutes(notif.trigger_time) : -1; break;
      default: continue;
    }

    if (triggerMinutes < 0 || currentMinutes < triggerMinutes) continue;

    const count = await sendToRole(supabase, notif.target_role, notif.title, notif.body, notif.id);
    await (supabase as any).from("auto_notification_log").insert({ notification_id: notif.id, date: todayStr });
    sent++;
    logger.info("auto-notif.sent", { name: notif.name, targets: count });
  }

  return { ok: true, sent, skipped };
}

// ═══════════════════════════════════════════
// 2. Late cashier checklist (>1h after opening)
// ═══════════════════════════════════════════

export async function dispatchLateChecklistAlert(): Promise<{
  ok: boolean;
  alerted: boolean;
}> {
  const supabase = createAdminClient();
  const now = nowInMontreal();
  const todayStr = dateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const dayOfWeek = now.getDay();

  // Check config
  const { data: configs } = await (supabase as any)
    .from("late_checklist_config")
    .select("delay_minutes, is_active, title, body")
    .eq("is_active", true)
    .limit(1);
  if (!configs || configs.length === 0) return { ok: true, alerted: false };
  const config = configs[0] as { delay_minutes: number; title: string; body: string };

  // Already alerted today?
  const { data: todayLog } = await (supabase as any)
    .from("late_checklist_log")
    .select("id")
    .eq("date", todayStr)
    .limit(1);
  if (todayLog && todayLog.length > 0) return { ok: true, alerted: false };

  // Get today's business hours
  const { data: seasons } = await (supabase as any)
    .from("business_seasons")
    .select("id, start_month, start_day, end_month, end_day");
  if (!seasons || seasons.length === 0) return { ok: true, alerted: false };

  const season = findSeason(seasons as Season[], month, day);
  if (!season) return { ok: true, alerted: false };

  const { data: holidays } = await (supabase as any)
    .from("business_holidays")
    .select("date")
    .eq("date", todayStr);
  const isHoliday = holidays && holidays.length > 0;
  const lookupDow = isHoliday ? 7 : dayOfWeek;

  const { data: hoursRows } = await (supabase as any)
    .from("business_hours")
    .select("open_time, close_time")
    .eq("season_id", season.id)
    .eq("day_of_week", lookupDow)
    .limit(1);
  if (!hoursRows || hoursRows.length === 0) return { ok: true, alerted: false };

  const openMinutes = timeToMinutes((hoursRows[0] as BusinessHours).open_time);
  const deadlineMinutes = openMinutes + config.delay_minutes;

  // Not past deadline yet
  if (currentMinutes < deadlineMinutes) return { ok: true, alerted: false };

  // Check if any checklist was submitted today
  const { data: checklists } = await (supabase as any)
    .from("cashier_checklists")
    .select("id")
    .gte("submitted_at", todayStr + "T00:00:00")
    .lt("submitted_at", todayStr + "T23:59:59")
    .limit(1);

  if (checklists && checklists.length > 0) return { ok: true, alerted: false };

  // No checklist submitted! Alert supervisors
  const count = await sendToRole(supabase, "superviseur", config.title, config.body, "late-checklist");
  await (supabase as any).from("late_checklist_log").insert({ date: todayStr });
  logger.info("late-checklist.alerted", { targets: count });
  return { ok: true, alerted: true };
}

// ═══════════════════════════════════════════
// 3. Dated notifications (recycling, etc.) with snooze
// ═══════════════════════════════════════════

export async function dispatchDatedNotifications(): Promise<{
  ok: boolean;
  sent: number;
}> {
  const supabase = createAdminClient();
  const now = nowInMontreal();
  const todayStr = dateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Get notifications for today (or snoozed to today)
  const { data: notifs } = await (supabase as any)
    .from("dated_notifications")
    .select("id, date, trigger_time, title, body, target_role, snoozed_to")
    .eq("is_active", true);
  if (!notifs || notifs.length === 0) return { ok: true, sent: 0 };

  // Filter: effective date is snoozed_to or original date
  const dueNotifs = (notifs as any[]).filter((n) => {
    const effectiveDate = n.snoozed_to || n.date;
    return effectiveDate === todayStr;
  });
  if (dueNotifs.length === 0) return { ok: true, sent: 0 };

  // Check which were already sent
  const ids = dueNotifs.map((n: any) => n.id);
  const { data: logs } = await (supabase as any)
    .from("dated_notification_log")
    .select("notification_id")
    .eq("date", todayStr)
    .in("notification_id", ids);
  const sentSet = new Set((logs ?? []).map((l: any) => l.notification_id));

  let sent = 0;
  for (const notif of dueNotifs) {
    if (sentSet.has(notif.id)) continue;

    const triggerMinutes = timeToMinutes(notif.trigger_time);
    if (currentMinutes < triggerMinutes) continue;

    const count = await sendToRole(supabase, notif.target_role, notif.title, notif.body, notif.id);
    await (supabase as any).from("dated_notification_log").insert({ notification_id: notif.id, date: todayStr });
    sent++;
    logger.info("dated-notif.sent", { title: notif.title, targets: count });
  }

  return { ok: true, sent };
}
