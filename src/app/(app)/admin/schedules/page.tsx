import Link from "next/link";
import { Card, EmptyState, LinkButton, PageHeader, formatDateTime } from "@/components/ui";
import { listSchedules } from "@/domain/notification-schedules/repository";
import { toggleScheduleAction } from "@/domain/notification-schedules/actions";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function summarizeDays(days: number[]): string {
  if (days.length === 7) return "Tous les jours";
  if (
    days.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => days.includes(d))
  ) {
    return "Semaine";
  }
  if (
    days.length === 2 &&
    [6, 7].every((d) => days.includes(d))
  ) {
    return "Week-end";
  }
  return days.map((d) => DAY_LABELS[d]).join(" · ");
}

export default async function AdminSchedulesPage() {
  const schedules = await listSchedules();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planifications"
        description="Notifications récurrentes (heures + jours + fuseau)."
        action={<LinkButton href="/admin/schedules/new">Nouvelle planification</LinkButton>}
      />

      {schedules.length === 0 ? (
        <EmptyState
          title="Aucune planification"
          description="Crée une planification pour automatiser tes notifications."
          action={<LinkButton href="/admin/schedules/new">Créer une planification</LinkButton>}
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Titre</th>
                <th className="px-4 py-2 font-medium">Récurrence</th>
                <th className="px-4 py-2 font-medium">Prochaine exécution</th>
                <th className="px-4 py-2 font-medium">État</th>
                <th className="px-4 py-2 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-neutral-900">{s.title}</p>
                    <p className="text-xs text-neutral-500">
                      {s.kind === "reminder" ? "Rappel" : "Notification"}
                      {s.category && ` • ${s.category.name}`}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top text-neutral-700">
                    <p>{s.times.join(" · ")}</p>
                    <p className="text-xs text-neutral-500">
                      {summarizeDays(s.days_of_week)} • {s.timezone}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top text-neutral-700">
                    {s.is_active && s.next_run_at ? (
                      <span title={s.timezone}>
                        {new Date(s.next_run_at).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                          timeZone: s.timezone,
                        })}
                      </span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                    {s.last_run_at && (
                      <p className="text-xs text-neutral-500">
                        Dernier : {formatDateTime(s.last_run_at)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <form action={toggleScheduleAction} className="inline-flex items-center gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="is_active" value={String(s.is_active)} />
                      <button
                        type="submit"
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition hover:opacity-80 ${
                          s.is_active
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-neutral-100 text-neutral-700 ring-neutral-200"
                        }`}
                        title="Basculer l'état"
                      >
                        {s.is_active ? "Actif" : "Pausé"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <Link
                      href={`/admin/schedules/${s.id}`}
                      className="text-sm font-medium text-neutral-900 hover:underline"
                    >
                      Modifier
                    </Link>
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
