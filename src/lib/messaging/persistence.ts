import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type { ChannelId, Message, NotifyContext } from "./types";

interface PersistArgs {
  channel: ChannelId;
  recipient: string | null;
  message: Message;
  status: "sent" | "failed" | "skipped";
  provider?: string;
  providerMessageId?: string;
  error?: string;
  context?: NotifyContext;
  userId?: string | null;
}

/**
 * Logge une tentative d'envoi dans notification_deliveries.
 * Utilise le service-role pour bypass RLS — la table n'a aucune
 * policy d'écriture pour les rôles authentifiés.
 *
 * Best-effort: en cas d'erreur DB, on log mais on ne fait pas échouer
 * l'envoi — l'observabilité ne doit jamais bloquer la fonctionnalité.
 */
export async function persistDelivery(args: PersistArgs): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("notification_deliveries").insert({
      channel: args.channel,
      recipient: args.recipient ?? "",
      subject: args.message.subject || null,
      body: args.message.body,
      status: args.status,
      provider: args.provider ?? null,
      provider_message_id: args.providerMessageId ?? null,
      error: args.error ?? null,
      metadata: (args.context?.metadata ?? {}) as never,
      user_id: args.userId ?? null,
      source: args.context?.source ?? null,
      source_id: args.context?.sourceId ?? null,
      sent_at: args.status === "sent" ? new Date().toISOString() : null,
    });
  } catch (err) {
    logger.warn("messaging.persist.failed", {
      channel: args.channel,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
