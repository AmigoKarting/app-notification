import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database, MessageChannel, DeliveryStatus } from "@/lib/supabase/database.types";
import { fromPostgrestError } from "@/domain/errors";

export type Delivery = Database["public"]["Tables"]["notification_deliveries"]["Row"];

export interface ListDeliveriesOptions {
  channel?: MessageChannel;
  status?: DeliveryStatus;
  source?: string;
  limit?: number;
  offset?: number;
}

export async function listDeliveries(
  opts: ListDeliveriesOptions = {},
): Promise<Delivery[]> {
  const { channel, status, source, limit = 100, offset = 0 } = opts;
  const supabase = createClient();

  let query = supabase
    .from("notification_deliveries")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (channel) query = query.eq("channel", channel);
  if (status) query = query.eq("status", status);
  if (source) query = query.eq("source", source);

  const { data, error } = await query;
  if (error) throw fromPostgrestError(error);
  return data ?? [];
}

export async function getDeliveryCounts(): Promise<{
  total: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  const supabase = createClient();
  const [total, sent, failed, skipped] = await Promise.all([
    supabase.from("notification_deliveries").select("*", { count: "exact", head: true }),
    supabase.from("notification_deliveries").select("*", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("notification_deliveries").select("*", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("notification_deliveries").select("*", { count: "exact", head: true }).eq("status", "skipped"),
  ]);

  return {
    total: total.count ?? 0,
    sent: sent.count ?? 0,
    failed: failed.count ?? 0,
    skipped: skipped.count ?? 0,
  };
}
