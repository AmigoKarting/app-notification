import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Database,
  FeedItemKind,
  FeedPriority,
} from "@/lib/supabase/database.types";
import { fromPostgrestError, RepositoryError } from "@/domain/errors";
import {
  createFeedItemSchema,
  updateFeedItemSchema,
} from "./schema";

export type FeedItem = Database["public"]["Tables"]["feed_items"]["Row"];

export type FeedItemWithRelations = FeedItem & {
  category: Pick<
    Database["public"]["Tables"]["categories"]["Row"],
    "id" | "slug" | "name" | "color" | "icon"
  > | null;
  session: Pick<
    Database["public"]["Tables"]["sessions"]["Row"],
    "id" | "slug" | "name" | "starts_at" | "ends_at" | "is_active"
  > | null;
  author: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "id" | "display_name" | "email"
  > | null;
};

export interface FeedItemEngagement {
  /** L'utilisateur courant a-t-il lu cet item ? */
  isRead: boolean;
  /** Emojis avec lesquels l'utilisateur courant a réagi */
  myReactions: string[];
  /** Compteur de réactions par emoji */
  reactionCounts: Record<string, number>;
  /** Total de lectures (utile côté admin) */
  readCount: number;
}

export interface ListFeedOptions {
  kind?: FeedItemKind;
  categoryId?: string;
  sessionId?: string;
  /** Si true, ne renvoie que les items visibles AUJOURD'HUI (employee feed). */
  visibleOnly?: boolean;
  /** Borne min (incluse) sur published_at, en ISO. */
  publishedSince?: string;
  /** Borne max (exclue) sur published_at, en ISO. */
  publishedBefore?: string;
  /** Texte libre cherché dans title et body (ilike). */
  search?: string;
  /** Catégories à exclure (mises en sourdine par l'utilisateur). */
  excludeCategoryIds?: string[];
  /** Filtre par auteur (created_by). */
  authorId?: string;
  limit?: number;
  offset?: number;
}

const SELECT =
  "*, category:categories(id, slug, name, color, icon), session:sessions(id, slug, name, starts_at, ends_at, is_active)";

// Helper pour attacher l'auteur (created_by → profile). On le fait via
// une 2e requête plutôt qu'un join PostgREST, parce que la FK de
// feed_items.created_by pointe sur auth.users (pas profiles) et
// PostgREST ne peut pas chaîner.
async function attachAuthors<T extends { created_by: string }>(
  items: T[],
): Promise<Array<T & { author: { id: string; display_name: string | null; email: string | null } | null }>> {
  if (items.length === 0) return [];
  const supabase = createClient();
  const userIds = Array.from(new Set(items.map((i) => i.created_by)));
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", userIds);
  const byId = new Map(
    (data ?? []).map((p) => [
      p.id,
      { id: p.id, display_name: p.display_name, email: p.email },
    ]),
  );
  return items.map((i) => ({ ...i, author: byId.get(i.created_by) ?? null }));
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string) => UUID_RE.test(v);

// ---------------------------------------------------------------------
// LIST
// ---------------------------------------------------------------------
export async function listFeedItems(
  opts: ListFeedOptions = {},
): Promise<FeedItemWithRelations[]> {
  const {
    kind,
    categoryId,
    sessionId,
    visibleOnly = false,
    publishedSince,
    publishedBefore,
    search,
    excludeCategoryIds,
    authorId,
    limit = 100,
    offset = 0,
  } = opts;
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("feed_items")
    .select(SELECT)
    // Épinglés d'abord, puis par date de publication décroissante.
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (kind) query = query.eq("kind", kind);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (sessionId) query = query.eq("session_id", sessionId);
  if (publishedSince) query = query.gte("published_at", publishedSince);
  if (publishedBefore) query = query.lt("published_at", publishedBefore);
  if (authorId) query = query.eq("created_by", authorId);
  if (excludeCategoryIds && excludeCategoryIds.length > 0) {
    query = query.not(
      "category_id",
      "in",
      `(${excludeCategoryIds.join(",")})`,
    );
  }
  if (search && search.trim().length > 0) {
    // Échappement minimal des caractères spéciaux de la syntaxe .or()
    const safe = search.trim().replace(/[%,()]/g, "");
    query = query.or(`title.ilike.%${safe}%,body.ilike.%${safe}%`);
  }

  if (visibleOnly) {
    // déjà publié ET pas expiré
    query = query.lte("published_at", nowIso);
    query = query.or(`expires_at.is.null,expires_at.gt.${nowIso}`);
  }

  const { data, error } = await query;
  if (error) throw fromPostgrestError(error);
  let items = (await attachAuthors(data ?? [])) as FeedItemWithRelations[];

  // Filtrage session active : difficile à exprimer dans une requête PostgREST
  // car il faut combiner is_active + bornes temporelles SUR LA TABLE JOINTE.
  // On filtre en mémoire — les pages utilisent un range/limit donc OK.
  if (visibleOnly) {
    items = items.filter((it) => {
      if (!it.session) return true; // pas de session attachée → toujours visible
      const s = it.session;
      if (!s.is_active) return false;
      const now = Date.now();
      return new Date(s.starts_at).getTime() <= now && new Date(s.ends_at).getTime() >= now;
    });
  }

  return items;
}

// ---------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------
export async function getFeedItem(id: string): Promise<FeedItemWithRelations | null> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feed_items")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  if (!data) return null;
  const withAuthor = await attachAuthors([data]);
  return withAuthor[0] as FeedItemWithRelations;
}

export interface FeedItemTargets {
  team_ids: string[];
  user_ids: string[];
}

export async function getFeedItemTargets(id: string): Promise<FeedItemTargets> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();

  const [teamsRes, usersRes] = await Promise.all([
    supabase.from("feed_item_target_teams").select("team_id").eq("feed_item_id", id),
    supabase.from("feed_item_target_users").select("user_id").eq("feed_item_id", id),
  ]);

  if (teamsRes.error) throw fromPostgrestError(teamsRes.error);
  if (usersRes.error) throw fromPostgrestError(usersRes.error);

  return {
    team_ids: (teamsRes.data ?? []).map((r) => r.team_id),
    user_ids: (usersRes.data ?? []).map((r) => r.user_id),
  };
}

// ---------------------------------------------------------------------
// CREATE / UPDATE / DELETE  (devs uniquement, RLS s'applique)
// ---------------------------------------------------------------------
async function persistTargets(
  feedItemId: string,
  mode: "all" | "teams" | "users",
  teamIds: string[],
  userIds: string[],
): Promise<void> {
  const supabase = createClient();
  // Reset
  await Promise.all([
    supabase.from("feed_item_target_teams").delete().eq("feed_item_id", feedItemId),
    supabase.from("feed_item_target_users").delete().eq("feed_item_id", feedItemId),
  ]);
  if (mode === "teams" && teamIds.length > 0) {
    const rows = Array.from(new Set(teamIds)).map((team_id) => ({
      feed_item_id: feedItemId,
      team_id,
    }));
    const { error } = await supabase.from("feed_item_target_teams").insert(rows);
    if (error) throw fromPostgrestError(error);
  }
  if (mode === "users" && userIds.length > 0) {
    const rows = Array.from(new Set(userIds)).map((user_id) => ({
      feed_item_id: feedItemId,
      user_id,
    }));
    const { error } = await supabase.from("feed_item_target_users").insert(rows);
    if (error) throw fromPostgrestError(error);
  }
}

export async function createFeedItem(createdBy: string, input: unknown): Promise<FeedItem> {
  const parsed = createFeedItemSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feed_items")
    .insert({
      created_by: createdBy,
      kind: parsed.data.kind,
      title: parsed.data.title,
      body: parsed.data.body,
      category_id: parsed.data.category_id,
      session_id: parsed.data.session_id,
      priority: parsed.data.priority,
      due_date: parsed.data.due_date,
      published_at: parsed.data.published_at ?? new Date().toISOString(),
      expires_at: parsed.data.expires_at,
      target_mode: parsed.data.target_mode,
      is_draft: parsed.data.is_draft,
      is_pinned: parsed.data.is_pinned,
      image_url: parsed.data.image_url,
      send_channels: parsed.data.send_channels,
    })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);

  await persistTargets(
    data.id,
    parsed.data.target_mode,
    parsed.data.target_team_ids,
    parsed.data.target_user_ids,
  );

  return data;
}

export async function updateFeedItem(id: string, input: unknown): Promise<FeedItem> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const parsed = updateFeedItemSchema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("validation", parsed.error.issues[0]?.message ?? "Données invalides");
  }
  const patch: Database["public"]["Tables"]["feed_items"]["Update"] = {};
  if (parsed.data.kind !== undefined) patch.kind = parsed.data.kind;
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.body !== undefined) patch.body = parsed.data.body;
  if (parsed.data.category_id !== undefined) patch.category_id = parsed.data.category_id;
  if (parsed.data.session_id !== undefined) patch.session_id = parsed.data.session_id;
  if (parsed.data.priority !== undefined) patch.priority = parsed.data.priority as FeedPriority;
  if (parsed.data.due_date !== undefined) patch.due_date = parsed.data.due_date;
  if (parsed.data.published_at !== undefined && parsed.data.published_at !== null) {
    patch.published_at = parsed.data.published_at;
  }
  if (parsed.data.expires_at !== undefined) patch.expires_at = parsed.data.expires_at;
  if (parsed.data.target_mode !== undefined) patch.target_mode = parsed.data.target_mode;
  if (parsed.data.is_draft !== undefined) patch.is_draft = parsed.data.is_draft;
  if (parsed.data.is_pinned !== undefined) patch.is_pinned = parsed.data.is_pinned;
  if (parsed.data.image_url !== undefined) patch.image_url = parsed.data.image_url;
  if (parsed.data.send_channels !== undefined) patch.send_channels = parsed.data.send_channels;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("feed_items")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);

  // Si on a touché au ciblage, on resync les jonctions
  if (
    parsed.data.target_mode !== undefined ||
    parsed.data.target_team_ids !== undefined ||
    parsed.data.target_user_ids !== undefined
  ) {
    await persistTargets(
      id,
      parsed.data.target_mode ?? data.target_mode,
      parsed.data.target_team_ids ?? [],
      parsed.data.target_user_ids ?? [],
    );
  }

  return data;
}

export async function deleteFeedItem(id: string): Promise<void> {
  if (!isUuid(id)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { error } = await supabase.from("feed_items").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

// ---------------------------------------------------------------------
// ENGAGEMENT : reads + reactions
// ---------------------------------------------------------------------

/**
 * Charge l'engagement de l'utilisateur courant sur une liste d'items.
 * Retourne un Map<feedItemId, FeedItemEngagement>.
 */
export async function getUserEngagement(
  userId: string,
  itemIds: string[],
): Promise<Map<string, FeedItemEngagement>> {
  const result = new Map<string, FeedItemEngagement>();
  if (itemIds.length === 0) return result;

  const supabase = createClient();

  const [readsRes, allReactionsRes, myReactionsRes] = await Promise.all([
    // Mes lectures sur ces items
    supabase
      .from("feed_item_reads")
      .select("feed_item_id")
      .eq("user_id", userId)
      .in("feed_item_id", itemIds),
    // Toutes les réactions sur ces items (pour les compteurs)
    supabase
      .from("feed_item_reactions")
      .select("feed_item_id, emoji")
      .in("feed_item_id", itemIds),
    // Mes réactions (pour savoir lesquelles surligner)
    supabase
      .from("feed_item_reactions")
      .select("feed_item_id, emoji")
      .eq("user_id", userId)
      .in("feed_item_id", itemIds),
  ]);

  const myReads = new Set((readsRes.data ?? []).map((r) => r.feed_item_id));
  const myReacts = new Map<string, Set<string>>();
  for (const r of myReactionsRes.data ?? []) {
    if (!myReacts.has(r.feed_item_id)) myReacts.set(r.feed_item_id, new Set());
    myReacts.get(r.feed_item_id)!.add(r.emoji);
  }
  const counts = new Map<string, Map<string, number>>();
  for (const r of allReactionsRes.data ?? []) {
    if (!counts.has(r.feed_item_id)) counts.set(r.feed_item_id, new Map());
    const m = counts.get(r.feed_item_id)!;
    m.set(r.emoji, (m.get(r.emoji) ?? 0) + 1);
  }

  for (const id of itemIds) {
    const countsMap = counts.get(id) ?? new Map();
    result.set(id, {
      isRead: myReads.has(id),
      myReactions: Array.from(myReacts.get(id) ?? []),
      reactionCounts: Object.fromEntries(countsMap),
      readCount: 0, // pas chargé ici par défaut, voir getReadCount pour admin
    });
  }
  return result;
}

/**
 * Compteur de lectures total pour un item (utilisé côté admin).
 */
export async function getReadCount(itemId: string): Promise<number> {
  if (!isUuid(itemId)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { count, error } = await supabase
    .from("feed_item_reads")
    .select("user_id", { count: "exact", head: true })
    .eq("feed_item_id", itemId);
  if (error) throw fromPostgrestError(error);
  return count ?? 0;
}

/**
 * Liste des emojis utilisés sur un item avec leur compteur (admin).
 */
export async function getReactionSummary(
  itemId: string,
): Promise<Array<{ emoji: string; count: number }>> {
  if (!isUuid(itemId)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feed_item_reactions")
    .select("emoji")
    .eq("feed_item_id", itemId);
  if (error) throw fromPostgrestError(error);
  const counts = new Map<string, number>();
  for (const r of data ?? []) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Détail user-par-user : qui a réagi avec quoi (pour stats admin).
 */
export async function getReactionsByUser(
  itemId: string,
): Promise<Array<{ user_id: string; display_name: string | null; email: string | null; emojis: string[] }>> {
  if (!isUuid(itemId)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { data: reactions, error } = await supabase
    .from("feed_item_reactions")
    .select("user_id, emoji")
    .eq("feed_item_id", itemId);
  if (error) throw fromPostgrestError(error);
  if (!reactions || reactions.length === 0) return [];

  const userIds = Array.from(new Set(reactions.map((r) => r.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", userIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const groups = new Map<string, string[]>();
  for (const r of reactions) {
    if (!groups.has(r.user_id)) groups.set(r.user_id, []);
    groups.get(r.user_id)!.push(r.emoji);
  }

  return Array.from(groups.entries()).map(([user_id, emojis]) => {
    const p = byId.get(user_id);
    return {
      user_id,
      display_name: p?.display_name ?? null,
      email: p?.email ?? null,
      emojis,
    };
  });
}

/**
 * Liste des utilisateurs qui ont lu un item (admin).
 */
export async function getReadersList(
  itemId: string,
): Promise<Array<{ user_id: string; display_name: string | null; email: string | null; read_at: string }>> {
  if (!isUuid(itemId)) throw new RepositoryError("validation", "Identifiant invalide");
  const supabase = createClient();
  const { data: reads, error } = await supabase
    .from("feed_item_reads")
    .select("user_id, read_at")
    .eq("feed_item_id", itemId)
    .order("read_at", { ascending: false });
  if (error) throw fromPostgrestError(error);
  if (!reads || reads.length === 0) return [];

  const userIds = Array.from(new Set(reads.map((r) => r.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", userIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return reads.map((r) => {
    const p = byId.get(r.user_id);
    return {
      user_id: r.user_id,
      display_name: p?.display_name ?? null,
      email: p?.email ?? null,
      read_at: r.read_at,
    };
  });
}

/**
 * Duplique un feed_item existant (sans ses targets — l'admin re-cible
 * via le formulaire). Crée un brouillon par défaut pour pouvoir relire/éditer.
 */
export async function duplicateFeedItem(
  id: string,
  createdBy: string,
): Promise<FeedItem> {
  const supabase = createClient();
  const original = await getFeedItem(id);
  if (!original) throw new RepositoryError("not_found", "Élément introuvable");

  const { data, error } = await supabase
    .from("feed_items")
    .insert({
      created_by: createdBy,
      kind: original.kind,
      title: `Copie de ${original.title}`.slice(0, 160),
      body: original.body,
      category_id: original.category_id,
      session_id: original.session_id,
      priority: original.priority,
      due_date: original.due_date,
      published_at: new Date().toISOString(),
      expires_at: original.expires_at,
      target_mode: original.target_mode,
      is_draft: true, // duplicat = brouillon par défaut, l'admin valide
      is_pinned: false,
      image_url: original.image_url,
      send_channels: original.send_channels,
      action_label: original.action_label,
      action_url: original.action_url,
    })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}
