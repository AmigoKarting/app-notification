import { Card, PageHeader, PageTip } from "@/components/ui";
import { getAnalytics } from "@/domain/analytics/repository";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const t = getServerDictionary();
  let data: Awaited<ReturnType<typeof getAnalytics>> | null = null;
  let loadError: string | null = null;

  try {
    data = await getAnalytics();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ADMIN ANALYTICS] Data fetch crashed:", msg, e);
    loadError = msg;
  }

  const successRate =
    data && data.totalDeliveries > 0
      ? Math.round((data.deliveriesSent / data.totalDeliveries) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.analytics.title}
        description={t.analytics.description}
        helpHref="/admin/aide/suivi-admin"
      />

      {loadError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Erreur de chargement</p>
          <pre className="mt-1 whitespace-pre-wrap text-xs">{loadError}</pre>
        </div>
      )}

      {data && (
        <>
          {/* Content */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {t.analytics.content}
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label={t.analytics.notifications}
                value={data.totalNotifications}
                accent="brand"
              />
              <Stat
                label={t.analytics.reminders}
                value={data.totalReminders}
                accent="brand"
              />
              <Stat
                label={t.analytics.published}
                value={data.published}
                accent="brand"
              />
              <Stat
                label={t.analytics.drafts}
                value={data.drafts}
                accent="brand"
              />
            </div>
          </section>

          {/* Deliveries */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {t.analytics.deliveries}
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Stat
                label={t.analytics.deliveries}
                value={data.totalDeliveries}
                accent="emerald"
              />
              <Stat
                label={t.analytics.sent}
                value={data.deliveriesSent}
                accent="emerald"
              />
              <Stat
                label={t.analytics.failed}
                value={data.deliveriesFailed}
                accent={data.deliveriesFailed > 0 ? "red" : "emerald"}
              />
              <Stat
                label={t.analytics.skipped}
                value={data.deliveriesSkipped}
                accent="emerald"
              />
              <Stat
                label={t.analytics.successRate}
                value={successRate}
                suffix="%"
                accent="emerald"
              />
            </div>
          </section>

          {/* Engagement */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {t.analytics.engagement}
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <Stat
                label={t.analytics.reads}
                value={data.totalReads}
                accent="amber"
              />
              <Stat
                label={t.analytics.reactions}
                value={data.totalReactions}
                accent="amber"
              />
              <Stat
                label={t.analytics.comments}
                value={data.totalComments}
                accent="amber"
              />
            </div>
          </section>

          {/* Users */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {t.analytics.users}
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <Stat
                label={t.analytics.users}
                value={data.totalUsers}
                accent="neutral"
              />
              <Stat
                label={t.analytics.admins}
                value={data.devUsers}
                accent="neutral"
              />
              <Stat
                label={t.analytics.employees}
                value={data.employeeUsers}
                accent="neutral"
              />
            </div>
          </section>

          {/* Last 7 days */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {t.analytics.last7days}
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
              <Stat
                label={t.analytics.recentNotifications}
                value={data.recentNotifications}
                accent="brand"
              />
              <Stat
                label={t.analytics.recentDeliveries}
                value={data.recentDeliveries}
                accent="emerald"
              />
            </div>
          </section>
        </>
      )}

      <PageTip>{t.pageTips.adminAnalytics}</PageTip>
    </div>
  );
}

const accentStyles = {
  brand: "border-l-brand-500 bg-brand-50/40",
  emerald: "border-l-emerald-500 bg-emerald-50/40",
  amber: "border-l-amber-500 bg-amber-50/40",
  red: "border-l-red-500 bg-red-50/40",
  neutral: "border-l-neutral-400 bg-neutral-50/40",
} as const;

function Stat({
  label,
  value,
  suffix,
  accent = "neutral",
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: keyof typeof accentStyles;
}) {
  return (
    <Card className={`border-l-4 p-3.5 ${accentStyles[accent]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-neutral-900">
        {value}{suffix}
      </p>
    </Card>
  );
}
