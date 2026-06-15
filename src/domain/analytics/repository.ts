import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AnalyticsData {
  // Feed stats
  totalNotifications: number;
  totalReminders: number;
  drafts: number;
  published: number;

  // Delivery stats
  totalDeliveries: number;
  deliveriesSent: number;
  deliveriesFailed: number;
  deliveriesSkipped: number;

  // Engagement stats
  totalReads: number;
  totalReactions: number;
  totalComments: number;

  // Users
  totalUsers: number;
  devUsers: number;
  employeeUsers: number;

  // Recent activity (last 7 days counts)
  recentNotifications: number;
  recentDeliveries: number;
}

export type AnalyticsRange = "7d" | "30d" | "all";

export async function getAnalytics(range: AnalyticsRange = "all"): Promise<AnalyticsData> {
  const supabase = createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const sinceMap: Record<AnalyticsRange, string | null> = {
    "7d": new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    "30d": new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    all: null,
  };
  const since = sinceMap[range];

  function q(table: string) {
    let builder = supabase.from(table).select("*", { count: "exact", head: true });
    if (since) builder = builder.gte("created_at", since);
    return builder;
  }

  const [
    totalNotifs,
    totalRemindersRes,
    drafts,
    totalDeliveries,
    deliveriesSent,
    deliveriesFailed,
    deliveriesSkipped,
    totalReads,
    totalReactions,
    totalComments,
    totalUsers,
    devUsers,
    recentNotifs,
    recentDeliveries,
  ] = await Promise.all([
    q("feed_items").eq("kind", "notification"),
    q("feed_items").eq("kind", "reminder"),
    q("feed_items").eq("is_draft", true),
    q("notification_deliveries"),
    q("notification_deliveries").eq("status", "sent"),
    q("notification_deliveries").eq("status", "failed"),
    q("notification_deliveries").eq("status", "skipped"),
    q("feed_item_reads"),
    q("feed_item_reactions"),
    q("comments"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "dev"),
    supabase.from("feed_items").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("notification_deliveries").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
  ]);

  const published = (totalNotifs.count ?? 0) + (totalRemindersRes.count ?? 0) - (drafts.count ?? 0);

  return {
    totalNotifications: totalNotifs.count ?? 0,
    totalReminders: totalRemindersRes.count ?? 0,
    drafts: drafts.count ?? 0,
    published,
    totalDeliveries: totalDeliveries.count ?? 0,
    deliveriesSent: deliveriesSent.count ?? 0,
    deliveriesFailed: deliveriesFailed.count ?? 0,
    deliveriesSkipped: deliveriesSkipped.count ?? 0,
    totalReads: totalReads.count ?? 0,
    totalReactions: totalReactions.count ?? 0,
    totalComments: totalComments.count ?? 0,
    totalUsers: totalUsers.count ?? 0,
    devUsers: devUsers.count ?? 0,
    employeeUsers: (totalUsers.count ?? 0) - (devUsers.count ?? 0),
    recentNotifications: recentNotifs.count ?? 0,
    recentDeliveries: recentDeliveries.count ?? 0,
  };
}
