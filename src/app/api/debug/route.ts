import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const supabase = createClient();

    // 1. Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    results.auth = authError ? { error: authError.message } : { userId: user?.id, email: user?.email };

    // 2. Test profiles
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      results.profile = profileError ? { error: profileError.message } : profile;
    }

    // 3. Test app_settings
    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    results.settings = settingsError ? { error: settingsError.message } : settings;

    // 4. Test feed_items
    const { data: feed, error: feedError } = await supabase
      .from("feed_items")
      .select("*")
      .limit(1);
    results.feed = feedError ? { error: feedError.message } : { count: feed?.length };

    // 5. Test categories
    const { data: cats, error: catsError } = await supabase
      .from("categories")
      .select("*")
      .limit(1);
    results.categories = catsError ? { error: catsError.message } : { count: cats?.length };

    // 6. Test sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("*")
      .limit(1);
    results.sessions = sessionsError ? { error: sessionsError.message } : { count: sessions?.length };

    // 7. Test schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("notification_schedules")
      .select("*")
      .limit(1);
    results.schedules = schedulesError ? { error: schedulesError.message } : { count: schedules?.length };

  } catch (err) {
    results.crash = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(results);
}
