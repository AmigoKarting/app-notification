import { NextResponse } from "next/server";
import { requireUser } from "@/domain/auth/session";
import { getCurrentProfile } from "@/domain/auth/role";
import { verifyTask } from "@/domain/supervisor/repository";

export async function POST(request: Request) {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "dev" && profile.role !== "superviseur")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { taskId, doneBy, rating, noTimeToFinish, qualityCertified } = body as {
    taskId: string;
    doneBy: string;
    rating: number;
    noTimeToFinish: boolean;
    qualityCertified: boolean;
  };

  if (!taskId || !doneBy || !rating) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await verifyTask({
    taskId,
    supervisorId: user.id,
    doneBy,
    rating,
    noTimeToFinish: !!noTimeToFinish,
    qualityCertified: !!qualityCertified,
  });

  return NextResponse.json({ ok: true });
}
