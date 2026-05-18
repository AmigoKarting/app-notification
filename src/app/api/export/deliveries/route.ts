import { NextResponse } from "next/server";
import { requireDev } from "@/domain/auth/role";
import { listDeliveries } from "@/domain/deliveries/repository";
import { toCSV } from "@/lib/csv";

export async function GET() {
  await requireDev();
  const items = await listDeliveries({ limit: 10000 });

  const headers = ["Date", "Channel", "Recipient", "Subject", "Status", "Provider", "Error"];
  const rows = items.map((item) => [
    item.created_at,
    item.channel,
    item.recipient,
    item.subject ?? "",
    item.status,
    item.provider ?? "",
    item.error ?? "",
  ]);
  const csv = toCSV(headers, rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=deliveries.csv",
    },
  });
}
