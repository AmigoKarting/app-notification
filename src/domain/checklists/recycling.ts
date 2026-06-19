import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function isRecyclingDay(): Promise<boolean> {
  const supabase = createClient();

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const { data } = await supabase
    .from("dated_notifications")
    .select("id")
    .eq("is_active", true)
    .ilike("title", "%recyclage%")
    .or(`date.eq.${todayStr},snoozed_to.eq.${todayStr}`)
    .limit(1);

  return (data ?? []).length > 0;
}
