import Link from "next/link";
import {
  AlertIcon,
  BellIcon,
  Card,
  CheckIcon,
  ClockIcon,
  EmptyState,
  LinkButton,
  PageHeader,
  PlusIcon,
  SparkleIcon,
  StatusBadge,
  formatDateTime,
} from "@/components/ui";
import { getReminderCounts, listReminders } from "@/domain/reminders/repository";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [counts, upcoming] = await Promise.all([
    getReminderCounts(),
    listReminders({ status: "pending", upcomingOnly: true, limit: 5 }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble des rappels."
        action={
          <LinkButton href="/reminders/new">
            <PlusIcon size={14} />
            Nouveau rappel
          </LinkButton>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total"
          value={counts.total}
          icon={<BellIcon className="text-brand-600" size={18} />}
          ringClass="bg-brand-50"
        />
        <StatCard
          label="En attente"
          value={counts.pending}
          icon={<ClockIcon className="text-amber-600" size={18} />}
          ringClass="bg-amber-50"
        />
        <StatCard
          label="Envoyés"
          value={counts.sent}
          icon={<CheckIcon className="text-emerald-600" size={18} />}
          ringClass="bg-emerald-50"
        />
        <StatCard
          label="En retard"
          value={counts.overdue}
          icon={<AlertIcon className="text-red-600" size={18} />}
          ringClass="bg-red-50"
          tone={counts.overdue > 0 ? "danger" : "default"}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Prochains rappels</h2>
          <Link
            href="/reminders"
            className="text-sm font-medium text-brand-700 transition hover:text-brand-800 hover:underline"
          >
            Voir tout →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState
            icon={<SparkleIcon size={32} />}
            title="Aucun rappel à venir"
            description="Crée un rappel pour qu'il apparaisse ici."
            action={
              <LinkButton href="/reminders/new">
                <PlusIcon size={14} />
                Créer un rappel
              </LinkButton>
            }
          />
        ) : (
          <Card>
            <ul className="divide-y divide-neutral-100">
              {upcoming.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-neutral-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-neutral-900">{r.message}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                      <span className="font-medium text-neutral-700">
                        {r.employee?.name ?? "Employé inconnu"}
                      </span>
                      <span className="text-neutral-300">•</span>
                      <ClockIcon size={12} className="text-neutral-400" />
                      {formatDateTime(r.scheduled_at)}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                  <Link
                    href={`/reminders/${r.id}`}
                    className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
                  >
                    Voir
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  ringClass,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  ringClass: string;
  tone?: "default" | "danger";
}) {
  return (
    <Card className="card-hover p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          {label}
        </p>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${ringClass}`}
        >
          {icon}
        </div>
      </div>
      <p
        className={`mt-3 text-3xl font-semibold tracking-tight ${
          tone === "danger" ? "text-red-600" : "text-neutral-900"
        }`}
      >
        {value}
      </p>
    </Card>
  );
}
