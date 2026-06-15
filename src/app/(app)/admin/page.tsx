import Link from "next/link";
import {
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  PageTip,
  PlusIcon,
} from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { listFeedItems } from "@/domain/feed/repository";
import { listSchedules } from "@/domain/notification-schedules/repository";
import { listActiveSessions } from "@/domain/sessions/repository";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const t = getServerDictionary();
  const locale = getLocale();
  let feed: Awaited<ReturnType<typeof listFeedItems>> = [];
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  let activeSessions: Awaited<ReturnType<typeof listActiveSessions>> = [];
  let schedules: Awaited<ReturnType<typeof listSchedules>> = [];
  let loadError: string | null = null;

  try {
    [feed, categories, activeSessions, schedules] = await Promise.all([
      listFeedItems({ limit: 5 }),
      listCategories(),
      listActiveSessions(),
      listSchedules(),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ADMIN PAGE] Data fetch crashed:", msg, e);
    loadError = msg;
  }

  const activeSchedules = schedules.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminOverview.title}
        description={t.adminOverview.description}
        helpHref="/admin/aide/bien-demarrer"
      />

      {feed.length === 0 && categories.length === 0 && schedules.length === 0 && !loadError && (
        <section className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-6 dark:border-brand-700/50 dark:bg-brand-950/20">
          <h2 className="text-lg font-semibold text-brand-900 dark:text-brand-200">{t.adminOverview.onboardingTitle}</h2>
          <p className="mt-1 text-sm text-brand-700 dark:text-brand-400">{t.adminOverview.onboardingDesc}</p>
          <ol className="mt-4 space-y-3">
            <OnboardingStep number={1} href="/admin/categories/new" label={t.adminOverview.onboardingStep1} />
            <OnboardingStep number={2} href="/admin/feed/new" label={t.adminOverview.onboardingStep2} />
            <OnboardingStep number={3} href="/admin/schedules/new" label={t.adminOverview.onboardingStep3} />
            <OnboardingStep number={4} href="/admin/branding" label={t.adminOverview.onboardingStep4} />
          </ol>
          <Link
            href="/admin/aide/bien-demarrer"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            {t.adminOverview.onboardingGuide} →
          </Link>
        </section>
      )}

      {loadError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">{t.adminOverview.loadError}</p>
          <pre className="mt-1 whitespace-pre-wrap text-xs">{loadError}</pre>
        </div>
      )}

      {/* Actions principales — gros boutons cliquables */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ActionCard
          href="/admin/feed/new"
          title={t.adminOverview.sendNotification}
          description={t.adminOverview.sendNotificationDesc}
        />
        <ActionCard
          href="/admin/schedules/new"
          title={t.adminOverview.planRecurring}
          description={t.adminOverview.planRecurringDesc}
        />
      </section>

      {/* Stats compactes */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t.adminOverview.publishedNotifications}
          value={feed.length}
          href="/admin/feed"
        />
        <Stat
          label={t.adminOverview.activeSchedules}
          value={activeSchedules}
          hint={`${schedules.length} ${t.adminOverview.total}`}
          href="/admin/schedules"
        />
        <Stat
          label={t.adminOverview.activePeriods}
          value={activeSessions.length}
          href="/admin/sessions"
        />
        <Stat label={t.adminOverview.categories} value={categories.length} href="/admin/categories" />
      </section>

      {/* Listes */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t.adminOverview.latestNotifications}</h2>
            <Link
              href="/admin/feed"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              {t.adminOverview.viewAll}
            </Link>
          </div>
          {feed.length === 0 ? (
            <EmptyState
              title={t.adminOverview.nothingYet}
              description={t.adminOverview.publishFirst}
              action={<LinkButton href="/admin/feed/new">{t.adminOverview.sendNow}</LinkButton>}
            />
          ) : (
            <Card>
              <ul className="divide-y divide-neutral-100">
                {feed.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {it.title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {it.kind === "reminder" ? t.feed.reminder : t.feed.notification}
                        {it.category && ` • ${it.category.name}`}
                      </p>
                    </div>
                    <Link
                      href={`/admin/feed/${it.id}`}
                      className="text-xs font-medium text-neutral-700 hover:underline"
                    >
                      {t.common.edit}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t.adminOverview.upcomingAutoSends}</h2>
            <Link
              href="/admin/schedules"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              {t.adminOverview.viewAll}
            </Link>
          </div>
          {schedules.length === 0 ? (
            <EmptyState
              title={t.adminOverview.noSchedules}
              description={t.adminOverview.automateNotifications}
              action={<LinkButton href="/admin/schedules/new">{t.adminOverview.create}</LinkButton>}
            />
          ) : (
            <Card>
              <ul className="divide-y divide-neutral-100">
                {schedules.slice(0, 5).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {s.title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {s.is_active && s.next_run_at
                          ? `${t.adminOverview.next} ${new Date(s.next_run_at).toLocaleString(locale === "en" ? "en-US" : "fr-FR", {
                              dateStyle: "short",
                              timeStyle: "short",
                              timeZone: s.timezone,
                            })}`
                          : t.adminOverview.paused}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        s.is_active
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-neutral-100 text-neutral-700 ring-neutral-200"
                      }`}
                    >
                      {s.is_active ? t.adminOverview.active : t.adminOverview.paused}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </section>

      <PageTip>{t.pageTips.adminOverview}</PageTip>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="card-hover group flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-soft"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <PlusIcon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-base font-semibold text-neutral-900">{title}</p>
        <p className="mt-0.5 text-sm text-neutral-600">{description}</p>
      </div>
      <span className="self-center text-neutral-400 transition group-hover:translate-x-1 group-hover:text-brand-700">
        →
      </span>
    </Link>
  );
}

function Stat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number;
  hint?: string;
  href?: string;
}) {
  const inner = (
    <Card className="p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-neutral-900">{value}</p>
      {hint && <p className="text-[10px] text-neutral-500">{hint}</p>}
    </Card>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="block transition hover:opacity-90">
      {inner}
    </Link>
  );
}

function OnboardingStep({ number, href, label }: { number: number; href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-brand-100/60 dark:hover:bg-brand-900/30"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {number}
        </span>
        <span className="text-sm font-medium text-neutral-800 group-hover:text-brand-900 dark:text-neutral-200 dark:group-hover:text-brand-300">
          {label}
        </span>
        <span className="ml-auto text-neutral-400 transition group-hover:translate-x-1 group-hover:text-brand-600">→</span>
      </Link>
    </li>
  );
}
