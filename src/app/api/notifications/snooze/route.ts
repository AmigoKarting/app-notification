import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDevOrSuperviseur } from "@/domain/auth/role";

export async function POST(request: Request) {
  try {
    await requireDevOrSuperviseur();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, snoozeTo } = await request.json();
  if (!id || !snoozeTo) {
    return NextResponse.json({ error: "missing id or snoozeTo" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await (supabase as any)
    .from("dated_notifications")
    .update({ snoozed_to: snoozeTo })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
