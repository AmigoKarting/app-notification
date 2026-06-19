import { NextResponse } from "next/server";
import { requireUser } from "@/domain/auth/session";
import { getCurrentProfile } from "@/domain/auth/role";
import { resolveUnfinishedTask } from "@/domain/supervisor/repository";

export async function POST(request: Request) {
  await requireUser();
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "dev" && profile.role !== "superviseur")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { taskId } = (await request.json()) as { taskId: string };
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  }

  await resolveUnfinishedTask(taskId);
  return NextResponse.json({ ok: true });
}
