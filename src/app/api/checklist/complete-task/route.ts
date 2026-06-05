import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerDictionary } from "@/lib/i18n/server";
import { listActiveChecklistTasks } from "@/domain/checklists/tasks-repository";

const bodySchema = z.object({
  taskKey: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const supabaseAuth = createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vérifier le rôle
  const { data: profile } = await supabaseAuth
    .from("profiles")
    .select("role, first_name, last_name, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "caissiere" && profile.role !== "dev")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { taskKey } = parsed.data;

  // Vérifier que la tâche existe et est active
  const activeTasks = await listActiveChecklistTasks();
  const task = activeTasks.find((t) => t.task_key === taskKey);
  if (!task) {
    return NextResponse.json({ error: "Unknown task" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const t = getServerDictionary();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Récupérer ou créer la checklist du jour
  const { data: existing } = await supabase
    .from("cashier_checklists")
    .select("id, completed_items")
    .eq("user_id", user.id)
    .gte("submitted_at", todayStart.toISOString())
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let completedItems: string[];

  if (existing) {
    // Ajouter la tâche si pas déjà dedans
    const current = existing.completed_items as string[];
    if (current.includes(taskKey)) {
      return NextResponse.json({ ok: true, alreadyDone: true });
    }
    completedItems = [...current, taskKey];
    await supabase
      .from("cashier_checklists")
      .update({
        completed_items: completedItems,
        total_items: activeTasks.length,
      })
      .eq("id", existing.id);
  } else {
    // Créer la checklist du jour avec cette première tâche
    completedItems = [taskKey];
    await supabase.from("cashier_checklists").insert({
      user_id: user.id,
      completed_items: completedItems,
      total_items: activeTasks.length,
    });
  }

  // Construire le nom de la caissière
  const cashierName =
    (profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.display_name?.trim()) ||
    user.email ||
    "Caissière";

  // Notification avec le nom de la tâche
  const notifTitle = `✅ ${cashierName}`;
  const notifBody = `**Tâche :** ${task.label}`;

  await supabase.from("feed_items").insert({
    kind: "notification" as const,
    status: "sent" as const,
    title: notifTitle,
    body: notifBody,
    priority: "low" as const,
    target_mode: "all" as const,
    is_draft: false,
    is_pinned: false,
    send_channels: [],
    created_by: user.id,
    published_at: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    completed: completedItems.length,
    total: activeTasks.length,
  });
}
