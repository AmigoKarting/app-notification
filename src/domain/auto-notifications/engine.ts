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
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: TZ }),
  );
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
  const dayOfWeek = now.getDay(); // 0=Sun

  // 1. Find current season
  const { data: seasons } = await (supabase as any)
    .from("business_seasons")
    .select("id, start_month, start_day, end_month, end_day");
  if (!seasons || seasons.length === 0) return { ok: true, sent: 0, skipped: 0 };

  const season = findSeason(seasons as Season[], month, day);
  if (!season) {
    logger.info("auto-notif.off-season", { month, day });
    return { ok: true, sent: 0, skipped: 0 };
  }

  // 2. Check if today is a holiday
  const { data: holidays } = await (supabase as any)
    .from("business_holidays")
    .select("date")
    .eq("date", todayStr);
  const isHoliday = holidays && holidays.length > 0;

  // 3. Get business hours for today
  const lookupDow = isHoliday ? 7 : dayOfWeek;
  const { data: hoursRows } = await (supabase as any)
    .from("business_hours")
    .select("open_time, close_time")
    .eq("season_id", season.id)
    .eq("day_of_week", lookupDow)
    .limit(1);

  if (!hoursRows || hoursRows.length === 0) {
    logger.info("auto-notif.closed-today", { todayStr, dayOfWeek, isHoliday });
    return { ok: true, sent: 0, skipped: 0 };
  }

  const hours = hoursRows[0] as BusinessHours;
  const openMinutes = timeToMinutes(hours.open_time);
  const closeMinutes = timeToMinutes(hours.close_time);

  // 4. Get active notifications
  const { data: notifs } = await (supabase as any)
    .from("auto_notifications")
    .select("id, name, trigger_type, trigger_time, offset_minutes, title, body, target_role")
    .eq("is_active", true);
  if (!notifs || notifs.length === 0) return { ok: true, sent: 0, skipped: 0 };

  // 5. Get already-sent today
  const notifIds = (notifs as AutoNotification[]).map((n) => n.id);
  const { data: logs } = await (supabase as any)
    .from("auto_notification_log")
    .select("notification_id")
    .eq("date", todayStr)
    .in("notification_id", notifIds);
  const sentSet = new Set((logs ?? []).map((l: any) => l.notification_id));

  // 6. Determine which to send
  let sent = 0;
  let skipped = 0;

  for (const notif of notifs as AutoNotification[]) {
    if (sentSet.has(notif.id)) {
      skipped++;
      continue;
    }

    let triggerMinutes: number;
    switch (notif.trigger_type) {
      case "opening":
        triggerMinutes = openMinutes + notif.offset_minutes;
        break;
      case "closing":
        triggerMinutes = closeMinutes + notif.offset_minutes;
        break;
      case "fixed_time":
        triggerMinutes = notif.trigger_time ? timeToMinutes(notif.trigger_time) : -1;
        break;
      default:
        continue;
    }

    if (triggerMinutes < 0 || currentMinutes < triggerMinutes) continue;

    // Time to send! Get all users with this role
    const { data: targets } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", notif.target_role);

    if (!targets || targets.length === 0) continue;

    for (const target of targets) {
      await notify({
        channels: ["push"],
        recipient: { userId: target.id },
        message: { subject: notif.title, body: notif.body },
        context: { source: "auto-notification", sourceId: notif.id },
      });
    }

    // Log it
    await (supabase as any)
      .from("auto_notification_log")
      .insert({ notification_id: notif.id, date: todayStr });

    sent++;
    logger.info("auto-notif.sent", { name: notif.name, targets: targets.length });
  }

  return { ok: true, sent, skipped };
}
