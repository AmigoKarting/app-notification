import Link from "next/link";
import {
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  StatusBadge,
  formatDateTime,
} from "@/components/ui";
import { listReminders, type ReminderStatus } from "@/domain/reminders/repository";
import { CancelReminderForm } from "./cancel-form";

export const dynamic = "force-dynamic";

const VALID_STATUSES: ReminderStatus[] = ["pending", "sent", "cancelled", "failed"];

interface PageProps {
  searchParams?: { status?: string };
}

export default async function RemindersPage({ searchParams }: PageProps) {
  const requested = searchParams?.status;
  const status =
    requested && (VALID_STATUSES as string[]).includes(requested)
      ? (requested as ReminderStatus)
      : undefined;

  const reminders = await listReminders({ status });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rappels"
        description="Liste des rappels planifiés ou déjà envoyés."
        action={<LinkButton href="/reminders/new">Nouveau rappel</LinkButton>}
      />

      <div className="flex gap-2 text-sm">
        <FilterLink href="/reminders" active={!status} label="Tous" />
        <FilterLink href="/reminders?status=pending" active={status === "pending"} label="En attente" />
        <FilterLink href="/reminders?status=sent" active={status === "sent"} label="Envoyés" />
        <FilterLink href="/reminders?status=failed" active={status === "failed"} label="Échec" />
        <FilterLink
          href="/reminders?status=cancelled"
          active={status === "cancelled"}
          label="Annulés"
        />
      </div>

      {reminders.length === 0 ? (
        <EmptyState
          title="Aucun rappel"
          description={
            status
              ? "Aucun rappel ne correspond à ce filtre."
              : "Crée un premier rappel pour le voir apparaître ici."
          }
          action={!status && <LinkButton href="/reminders/new">Créer un rappel</LinkButton>}
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Employé</th>
                <th className="px-4 py-2 font-medium">Message</th>
                <th className="px-4 py-2 font-medium">Échéance</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {reminders.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-neutral-900">{r.employee?.name ?? "—"}</p>
                    <p className="text-xs text-neutral-500">{r.employee?.email ?? ""}</p>
                  </td>
                  <td className="max-w-md px-4 py-3 align-top text-neutral-700">
                    <p className="line-clamp-2">{r.message}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top text-neutral-700">
                    {formatDateTime(r.scheduled_at)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top text-right">
                    <div className="flex justify-end gap-3">
                      {r.status === "pending" && <CancelReminderForm id={r.id} />}
                      <Link
                        href={`/reminders/${r.id}`}
                        className="text-sm font-medium text-neutral-900 hover:underline"
                      >
                        Modifier
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 transition ${
        active
          ? "bg-neutral-900 text-white"
          : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      {label}
    </Link>
  );
}
