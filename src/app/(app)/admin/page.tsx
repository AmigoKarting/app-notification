import Link from "next/link";
import {
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  PlusIcon,
} from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { listFeedItems } from "@/domain/feed/repository";
import { listSchedules } from "@/domain/notification-schedules/repository";
import { listActiveSessions } from "@/domain/sessions/repository";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [feed, categories, activeSessions, schedules] = await Promise.all([
    listFeedItems({ limit: 5 }),
    listCategories(),
    listActiveSessions(),
    listSchedules(),
  ]);

  const activeSchedules = schedules.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aperçu"
        description="Tout ce qui compte au même endroit."
      />

      {/* Actions principales — gros boutons cliquables */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ActionCard
          href="/admin/feed/new"
          title="Envoyer une notification"
          description="Un message ponctuel, maintenant ou à une date précise."
        />
        <ActionCard
          href="/admin/schedules/new"
          title="Planifier un message récurrent"
          description="Choisis des heures et des jours — l'envoi est automatique."
        />
      </section>

      {/* Stats compactes */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Notifications publiées"
          value={feed.length}
          href="/admin/feed"
        />
        <Stat
          label="Planifications actives"
          value={activeSchedules}
          hint={`${schedules.length} au total`}
          href="/admin/schedules"
        />
        <Stat
          label="Périodes en cours"
          value={activeSessions.length}
          href="/admin/sessions"
        />
        <Stat label="Catégories" value={categories.length} href="/admin/categories" />
      </section>

      {/* Listes */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Dernières notifications</h2>
            <Link
              href="/admin/feed"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Tout voir →
            </Link>
          </div>
          {feed.length === 0 ? (
            <EmptyState
              title="Rien encore"
              description="Publie ta première notification."
              action={<LinkButton href="/admin/feed/new">Envoyer maintenant</LinkButton>}
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
                        {it.kind === "reminder" ? "Rappel" : "Notification"}
                        {it.category && ` • ${it.category.name}`}
                      </p>
                    </div>
                    <Link
                      href={`/admin/feed/${it.id}`}
                      className="text-xs font-medium text-neutral-700 hover:underline"
                    >
                      Ouvrir
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Prochains envois automatiques</h2>
            <Link
              href="/admin/schedules"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Tout voir →
            </Link>
          </div>
          {schedules.length === 0 ? (
            <EmptyState
              title="Aucune planification"
              description="Automatise tes notifications récurrentes."
              action={<LinkButton href="/admin/schedules/new">Créer</LinkButton>}
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
                          ? `Prochain : ${new Date(s.next_run_at).toLocaleString("fr-FR", {
                              dateStyle: "short",
                              timeStyle: "short",
                              timeZone: s.timezone,
                            })}`
                          : "En pause"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        s.is_active
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-neutral-100 text-neutral-700 ring-neutral-200"
                      }`}
                    >
                      {s.is_active ? "Actif" : "Pause"}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </section>
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
