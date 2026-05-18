import { NextResponse } from "next/server";
import { requireUser } from "@/domain/auth/session";
import { listReminders } from "@/domain/reminders/repository";
import { toCSV } from "@/lib/csv";

export async function GET() {
  await requireUser();
  const items = await listReminders({ limit: 10000 });

  const headers = ["Employee", "Message", "Scheduled At", "Status"];
  const rows = items.map((item) => [
    item.employee?.name ?? "",
    item.message,
    item.scheduled_at,
    item.status,
  ]);
  const csv = toCSV(headers, rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=reminders.csv",
    },
  });
}
