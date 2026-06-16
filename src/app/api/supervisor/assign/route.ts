import { NextResponse } from "next/server";
import { requireUser } from "@/domain/auth/session";
import { getCurrentProfile } from "@/domain/auth/role";
import { assignTask, unassignTask } from "@/domain/supervisor/repository";

export async function POST(request: Request) {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "dev" && profile.role !== "superviseur")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { taskId, assign } = body as { taskId: string; assign: boolean };

  if (!taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }

  if (assign) {
    await assignTask(taskId, user.id);
  } else {
    await unassignTask(taskId, user.id);
  }

  return NextResponse.json({ ok: true });
}
