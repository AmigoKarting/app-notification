import { NextResponse } from "next/server";
import { requireUser } from "@/domain/auth/session";
import { getCurrentProfile } from "@/domain/auth/role";
import { verifyTask } from "@/domain/supervisor/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/messaging";

export async function POST(request: Request) {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "dev" && profile.role !== "superviseur")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { taskId, doneBy, rating, comment, noTimeToFinish, qualityCertified, supervisorName } = body as {
    taskId: string;
    doneBy: string;
    rating: number;
    comment?: string;
    noTimeToFinish: boolean;
    qualityCertified: boolean;
    supervisorName?: string;
  };

  if (!taskId || !doneBy || !rating) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await verifyTask({
    taskId,
    supervisorId: user.id,
    doneBy,
    rating,
    comment: comment || null,
    noTimeToFinish: !!noTimeToFinish,
    qualityCertified: !!qualityCertified,
  });

  const supabase = createAdminClient();

  const { data: task } = await (supabase as any)
    .from("supervisor_tasks")
    .select("label")
    .eq("id", taskId)
    .maybeSingle();

  const taskLabel = task?.label ?? "Tâche";
  const who = supervisorName || profile.first_name || "Superviseur";
  const statusTag = noTimeToFinish ? " (pas eu le temps)" : qualityCertified ? " ✓" : "";
  const commentLine = comment ? `\n💬 ${comment}` : "";

  const notifTitle = `📋 ${who} — ${rating}/10${statusTag}`;
  const notifBody = `**${taskLabel}**\nFait par: ${doneBy}${commentLine}`;

  await supabase.from("feed_items").insert({
    kind: "notification" as const,
    status: "sent" as const,
    title: notifTitle,
    body: notifBody,
    priority: "low" as const,
    target_mode: "all" as const,
    is_draft: false,
    is_pinned: false,
    send_channels: ["push"],
    created_by: user.id,
    published_at: new Date().toISOString(),
  });

  const { data: devs } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "dev");

  if (devs) {
    await Promise.allSettled(
      devs.filter((d) => d.id !== user.id).map((dev) =>
        notify({
          channels: ["push"],
          recipient: { userId: dev.id },
          message: { subject: notifTitle, body: `${taskLabel} — Fait par: ${doneBy}${commentLine}` },
          context: { source: "supervisor-verify", sourceId: taskId },
        })
      )
    );
  }

  return NextResponse.json({ ok: true });
}
