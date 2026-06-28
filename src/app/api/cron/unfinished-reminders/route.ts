import { NextResponse } from "next/server";
import { listUnfinishedTasks, listAssignedButUnverifiedTasks } from "@/domain/supervisor/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < header.length; i++) diff |= header.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function handle(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const unfinished = await listUnfinishedTasks();
  let sent = 0;

  if (unfinished.length > 0) {
    const supabase = createAdminClient();
    const { data: devs } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "dev");

    const { data: supervisors } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "superviseur");

    const recipients = [...(devs ?? []), ...(supervisors ?? [])];

    for (const task of unfinished) {
      const who = task.supervisor_name || "Superviseur";
      const section = task.task_section === "caisse" ? "Caisse" : "Piste";
      const commentLine = task.comment ? `\n💬 ${task.comment}` : "";

      const title = `⚠️ Tache non terminee — ${task.task_label}`;
      const body = `${section} · ${who} · ${task.rating}/10\nFait par: ${task.done_by}${commentLine}\n📅 ${task.date}`;

      await Promise.allSettled(
        recipients.map((r) =>
          notify({
            channels: ["push"],
            recipient: { userId: r.id },
            message: { subject: title, body },
            context: { source: "unfinished-reminder", sourceId: task.id },
          })
        )
      );
      sent++;
    }
  }

  const unverified = await listAssignedButUnverifiedTasks();
  for (const task of unverified) {
    const title = `🔔 Rappel — tâche à vérifier`;
    const body = `« ${task.task_label} » a été assignée il y a un moment mais pas encore vérifiée. N'oublie pas d'aller vérifier!`;

    await notify({
      channels: ["push"],
      recipient: { userId: task.supervisor_id },
      message: { subject: title, body },
      context: { source: "unverified-reminder", sourceId: task.id },
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent, tasks: unfinished.length, unverified: unverified.length });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
