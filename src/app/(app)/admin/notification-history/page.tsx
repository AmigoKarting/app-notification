import { PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";
import { HistoryAccordion } from "./history-accordion";

export const dynamic = "force-dynamic";

interface FeedRow {
  id: string;
  title: string;
  body: string | null;
  published_at: string;
  created_by: string;
}

export default async function NotificationHistoryPage() {
  const t = getServerDictionary();
  const locale = getLocale();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const supabase = createClient();
  const { data } = await supabase
    .from("feed_items")
    .select("id, title, body, published_at, created_by")
    .gte("published_at", monthStart.toISOString())
    .lt("published_at", monthEnd.toISOString())
    .order("published_at", { ascending: false });

  const items: FeedRow[] = (data ?? []) as FeedRow[];

  const dayNames = [
    t.notifHistory.sunday,
    t.notifHistory.monday,
    t.notifHistory.tuesday,
    t.notifHistory.wednesday,
    t.notifHistory.thursday,
    t.notifHistory.friday,
    t.notifHistory.saturday,
  ];

  type DayGroup = { dayLabel: string; date: string; items: FeedRow[] };
  type WeekGroup = { weekLabel: string; dateRange: string; days: DayGroup[]; total: number };

  const weeks: WeekGroup[] = [];
  const weekMap = new Map<number, { start: Date; end: Date; items: FeedRow[] }>();

  for (const item of items) {
    const d = new Date(item.published_at);
    const dayOfMonth = d.getDate();
    const dayOfWeek = d.getDay();
    const mondayOffset = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const weekMonday = new Date(d);
    weekMonday.setDate(dayOfMonth - mondayOffset);
    weekMonday.setHours(0, 0, 0, 0);
    const weekKey = weekMonday.getTime();

    if (!weekMap.has(weekKey)) {
      const weekSunday = new Date(weekMonday);
      weekSunday.setDate(weekMonday.getDate() + 6);
      weekMap.set(weekKey, { start: weekMonday, end: weekSunday, items: [] });
    }
    weekMap.get(weekKey)!.items.push(item);
  }

  const sortedWeeks = [...weekMap.entries()].sort((a, b) => b[0] - a[0]);

  const dateFmt = locale === "en" ? "en-US" : "fr-CA";

  for (let wi = 0; wi < sortedWeeks.length; wi++) {
    const [, week] = sortedWeeks[wi];
    const weekNum = wi + 1;
    const startStr = week.start.toLocaleDateString(dateFmt, { day: "numeric", month: "short" });
    const endStr = week.end.toLocaleDateString(dateFmt, { day: "numeric", month: "short" });

    const dayMap = new Map<string, FeedRow[]>();
    for (const item of week.items) {
      const d = new Date(item.published_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)!.push(item);
    }

    const days: DayGroup[] = [...dayMap.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, dayItems]) => {
        const d = new Date(dateKey + "T12:00:00");
        const dayName = dayNames[d.getDay()];
        const dateStr = d.toLocaleDateString(dateFmt, { day: "numeric", month: "long", year: "numeric" });
        return { dayLabel: dayName, date: dateStr, items: dayItems };
      });

    weeks.push({
      weekLabel: `${t.notifHistory.week} ${sortedWeeks.length - wi}`,
      dateRange: `${startStr} – ${endStr}`,
      days,
      total: week.items.length,
    });
  }

  const monthLabel = now.toLocaleDateString(dateFmt, { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.notifHistory.title}
        description={`${monthLabel} — ${items.length} ${t.notifHistory.total.toLowerCase()}`}
      />
      <HistoryAccordion weeks={weeks} noNotifs={t.notifHistory.noNotifs} noNotifsDay={t.notifHistory.noNotifsDay} totalLabel={t.notifHistory.total} />
    </div>
  );
}
