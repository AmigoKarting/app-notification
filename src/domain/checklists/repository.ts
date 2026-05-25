import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function hasSubmittedToday(userId: string): Promise<boolean> {
  const supabase = createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("cashier_checklists")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("submitted_at", todayStart.toISOString());

  return (count ?? 0) > 0;
}

export interface ChecklistWithProfile {
  id: string;
  user_id: string;
  completed_items: string[];
  total_items: number;
  notes: string | null;
  submitted_at: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
}

export async function listRecentChecklists(limit = 30): Promise<ChecklistWithProfile[]> {
  const supabase = createAdminClient();

  const { data: checklists } = await supabase
    .from("cashier_checklists")
    .select("id, user_id, completed_items, total_items, notes, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (!checklists || checklists.length === 0) return [];

  const userIds = [...new Set(checklists.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  return checklists.map((c) => {
    const profile = profileMap.get(c.user_id);
    return {
      ...c,
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      display_name: profile?.display_name ?? null,
    };
  });
}
