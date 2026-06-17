import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { notify, type ChannelId } from "@/lib/messaging";
import { substituteVariables } from "@/lib/variables";

interface FeedItemSummary {
  id: string;
  title: string;
  body: string | null;
  target_mode: "all" | "teams" | "users";
  target_roles?: string[] | null;
  send_channels: string[];
  created_by: string;
}

interface Recipient {
  userId: string;
  email: string | null;
  name: string | null;
}

/**
 * Résout les destinataires d'un feed_item selon son target_mode :
 *  - all   → tous les profils
 *  - teams → membres des teams ciblées (via feed_item_target_teams + team_members)
 *  - users → utilisateurs ciblés directement
 *
 * Utilise le service-role pour bypasser RLS (le dev a déjà eu son accès vérifié
 * en amont via requireDev() dans l'action serveur).
 */
async function resolveRecipients(item: FeedItemSummary): Promise<Recipient[]> {
  const supabase = createAdminClient();

  if (item.target_mode === "all") {
    let query = supabase
      .from("profiles")
      .select("id, email, display_name, role");
    if (item.target_roles && item.target_roles.length > 0) {
      query = query.in("role", item.target_roles);
    } else {
      query = query.neq("role", "caissiere");
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((p) => ({
      userId: p.id,
      email: p.email,
      name: p.display_name,
    }));
  }

  if (item.target_mode === "users") {
    const { data: targets } = await supabase
      .from("feed_item_target_users")
      .select("user_id")
      .eq("feed_item_id", item.id);
    const userIds = (targets ?? []).map((t) => t.user_id);
    if (userIds.length === 0) return [];
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", userIds);
    if (error) throw error;
    return (profiles ?? []).map((p) => ({
      userId: p.id,
      email: p.email,
      name: p.display_name,
    }));
  }

  // target_mode === 'teams'
  const { data: teamTargets } = await supabase
    .from("feed_item_target_teams")
    .select("team_id")
    .eq("feed_item_id", item.id);
  const teamIds = (teamTargets ?? []).map((t) => t.team_id);
  if (teamIds.length === 0) return [];

  const { data: members } = await supabase
    .from("team_members")
    .select("user_id")
    .in("team_id", teamIds);
  const userIds = Array.from(new Set((members ?? []).map((m) => m.user_id)));
  if (userIds.length === 0) return [];

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .in("id", userIds);
  if (error) throw error;
  return (profiles ?? []).map((p) => ({
    userId: p.id,
    email: p.email,
    name: p.display_name,
  }));
}

/**
 * Si le feed_item demande un envoi multi-canal (send_channels non vide),
 * notifie chaque destinataire via notify() pour chaque canal demandé.
 *
 * Fire-and-forget côté action : on logue les résultats mais on ne fait pas
 * échouer la création du feed_item si un envoi rate (les destinataires
 * voient quand même la notif dans le fil).
 */
export async function dispatchFeedItemExternal(
  item: FeedItemSummary,
): Promise<{ attempted: number; sent: number; failed: number }> {
  const channels = item.send_channels.filter((c): c is ChannelId =>
    ["email", "sms", "whatsapp"].includes(c),
  );
  if (channels.length === 0) {
    return { attempted: 0, sent: 0, failed: 0 };
  }

  const recipients = await resolveRecipients(item);
  let attempted = 0;
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    // Substitution des variables {name}/{email} dans le contenu, pour
    // personnaliser chaque envoi externe.
    const ctx = { name: recipient.name, email: recipient.email };
    const subject = substituteVariables(item.title, ctx);
    const body = substituteVariables(item.body ?? item.title, ctx);

    const results = await notify({
      channels,
      recipient: {
        userId: recipient.userId,
        email: recipient.email,
        name: recipient.name,
      },
      message: {
        subject,
        body,
      },
      context: {
        source: "feed_item",
        sourceId: item.id,
        metadata: { target_mode: item.target_mode },
      },
    });

    attempted += results.length;
    for (const r of results) {
      if (r.status === "sent") sent++;
      else if (r.status === "failed") failed++;
    }
  }

  logger.info("feed.dispatch.done", {
    feedItemId: item.id,
    channels,
    recipients: recipients.length,
    attempted,
    sent,
    failed,
  });

  return { attempted, sent, failed };
}
