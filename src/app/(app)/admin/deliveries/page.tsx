import Link from "next/link";
import { Card, EmptyState, PageHeader, formatDateTime } from "@/components/ui";
import { channelRegistry } from "@/lib/messaging";
import { getDeliveryCounts, listDeliveries } from "@/domain/deliveries/repository";
import type { DeliveryStatus, MessageChannel } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

const CHANNELS: MessageChannel[] = ["email", "sms", "whatsapp"];
const STATUSES: DeliveryStatus[] = ["queued", "sent", "failed", "skipped"];

interface PageProps {
  searchParams?: { channel?: string; status?: string };
}

export default async function AdminDeliveriesPage({ searchParams }: PageProps) {
  const channel =
    searchParams?.channel && (CHANNELS as string[]).includes(searchParams.channel)
      ? (searchParams.channel as MessageChannel)
      : undefined;
  const status =
    searchParams?.status && (STATUSES as string[]).includes(searchParams.status)
      ? (searchParams.status as DeliveryStatus)
      : undefined;

  const [deliveries, counts] = await Promise.all([
    listDeliveries({ channel, status, limit: 200 }),
    getDeliveryCounts(),
  ]);

  const registered = channelRegistry.list();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Envois"
        description="Audit des messages partis (email, SMS, WhatsApp...)."
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total" value={counts.total} />
        <Stat label="Envoyés" value={counts.sent} />
        <Stat label="Échecs" value={counts.failed} tone={counts.failed > 0 ? "danger" : "default"} />
        <Stat label="Ignorés" value={counts.skipped} />
      </section>

      <Card className="p-4">
        <p className="text-sm font-medium text-neutral-900">Canaux enregistrés</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {registered.map((c) => (
            <span
              key={c.id}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                c.isAvailable()
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-neutral-100 text-neutral-600 ring-neutral-200"
              }`}
            >
              {c.displayName} {c.isAvailable() ? "" : "(non configuré)"}
            </span>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2 text-sm">
        <Filter href="/admin/deliveries" active={!channel && !status} label="Tout" />
        {CHANNELS.map((c) => (
          <Filter
            key={c}
            href={`/admin/deliveries?channel=${c}`}
            active={channel === c}
            label={c.toUpperCase()}
          />
        ))}
        {STATUSES.map((s) => (
          <Filter
            key={s}
            href={`/admin/deliveries?status=${s}`}
            active={status === s}
            label={s}
          />
        ))}
      </div>

      {deliveries.length === 0 ? (
        <EmptyState title="Aucun envoi" description="Aucun message ne correspond aux filtres." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Canal</th>
                <th className="px-4 py-2 font-medium">Destinataire</th>
                <th className="px-4 py-2 font-medium">Sujet / Message</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium">Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {deliveries.map((d) => (
                <tr key={d.id} className="hover:bg-neutral-50">
                  <td className="whitespace-nowrap px-4 py-3 align-top text-neutral-700">
                    {formatDateTime(d.created_at)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium uppercase">
                      {d.channel}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 align-top">{d.recipient}</td>
                  <td className="max-w-md px-4 py-3 align-top">
                    <p className="font-medium text-neutral-900">{d.subject ?? "—"}</p>
                    <p className="line-clamp-2 text-xs text-neutral-500">{d.body}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusPill status={d.status} />
                    {d.error && (
                      <p
                        className="mt-1 max-w-xs truncate text-xs text-red-600"
                        title={d.error}
                      >
                        {d.error}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-neutral-600">
                    {d.provider ?? "—"}
                    {d.provider_message_id && (
                      <p className="text-[10px] text-neutral-400" title={d.provider_message_id}>
                        {d.provider_message_id.slice(0, 16)}…
                      </p>
                    )}
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

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === "danger" ? "text-red-600" : "text-neutral-900"}`}>
        {value}
      </p>
    </Card>
  );
}

function StatusPill({ status }: { status: DeliveryStatus }) {
  const styles: Record<DeliveryStatus, string> = {
    queued: "bg-neutral-100 text-neutral-700 ring-neutral-200",
    sent: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    failed: "bg-red-50 text-red-700 ring-red-200",
    skipped: "bg-amber-50 text-amber-800 ring-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function Filter({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 transition ${
        active ? "bg-neutral-900 text-white" : "border border-neutral-200 bg-white hover:bg-neutral-50"
      }`}
    >
      {label}
    </Link>
  );
}
