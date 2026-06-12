import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Retourne les tâches déjà complétées aujourd'hui pour un utilisateur.
 */
export async function getTodayCompleted(userId: string): Promise<string[]> {
  const supabase = createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("cashier_checklists")
    .select("completed_items")
    .eq("user_id", userId)
    .gte("submitted_at", todayStart.toISOString())
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.completed_items as string[]) ?? [];
}

export async function hasSubmittedToday(userId: string): Promise<boolean> {
  const items = await getTodayCompleted(userId);
  return items.length > 0;
}

export async function getStreak(userId: string): Promise<number> {
  const supabase = createClient();

  const { data } = await supabase
    .from("cashier_checklists")
    .select("submitted_at")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(120);

  if (!data || data.length === 0) return 0;

  const uniqueDates = new Set<string>();
  for (const row of data) {
    const d = new Date(row.submitted_at);
    uniqueDates.add(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }

  const sortedDates = [...uniqueDates].sort().reverse();

  let streak = 0;
  const checkDate = new Date();

  for (const dateStr of sortedDates) {
    const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;

    if (dateStr === checkStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr < checkStr) {
      break;
    }
  }

  return streak;
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
