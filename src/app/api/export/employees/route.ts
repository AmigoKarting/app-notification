import { NextResponse } from "next/server";
import { requireUser } from "@/domain/auth/session";
import { listEmployees } from "@/domain/employees/repository";
import { toCSV } from "@/lib/csv";

export async function GET() {
  await requireUser();
  const items = await listEmployees({ limit: 10000 });

  const headers = ["Name", "Email", "Phone"];
  const rows = items.map((item) => [
    item.name,
    item.email,
    item.phone ?? "",
  ]);
  const csv = toCSV(headers, rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=employees.csv",
    },
  });
}
