import Link from "next/link";
import {
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  PageTip,
  StatusBadge,
  formatDateTime,
} from "@/components/ui";
import { listReminders, type ReminderStatus } from "@/domain/reminders/repository";
import { CancelReminderForm } from "./cancel-form";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const VALID_STATUSES: ReminderStatus[] = ["pending", "sent", "cancelled", "failed"];

interface PageProps {
  searchParams?: { status?: string };
}

export default async function RemindersPage({ searchParams }: PageProps) {
  const t = getServerDictionary();
  const locale = getLocale();
  const requested = searchParams?.status;
  const status =
    requested && (VALID_STATUSES as string[]).includes(requested)
      ? (requested as ReminderStatus)
      : undefined;

  const reminders = await listReminders({ status });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.reminders.title}
        description={t.reminders.description}
        action={<LinkButton href="/reminders/new">{t.reminders.newReminder}</LinkButton>}
      />

      <div className="flex gap-2 text-sm">
        <FilterLink href="/reminders" active={!status} label={t.reminders.all} />
        <FilterLink href="/reminders?status=pending" active={status === "pending"} label={t.reminders.pending} />
        <FilterLink href="/reminders?status=sent" active={status === "sent"} label={t.reminders.sent} />
        <FilterLink href="/reminders?status=failed" active={status === "failed"} label={t.reminders.failed} />
        <FilterLink
          href="/reminders?status=cancelled"
          active={status === "cancelled"}
          label={t.reminders.cancelled}
        />
      </div>

      {reminders.length === 0 ? (
        <EmptyState
          title={t.reminders.noReminders}
          description={
            status
              ? t.reminders.noRemindersFiltered
              : t.reminders.noRemindersDesc
          }
          action={!status && <LinkButton href="/reminders/new">{t.reminders.createReminder}</LinkButton>}
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">{t.reminders.employee}</th>
                <th className="px-4 py-2 font-medium">{t.reminders.message}</th>
                <th className="px-4 py-2 font-medium">{t.reminders.deadline}</th>
                <th className="px-4 py-2 font-medium">{t.reminders.status}</th>
                <th className="px-4 py-2 font-medium text-right">{t.reminders.actions}</th>
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
                    {formatDateTime(r.scheduled_at, locale === "en" ? "en-US" : "fr-FR")}
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
                        {t.reminders.edit}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <PageTip>{t.pageTips.reminders}</PageTip>
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
