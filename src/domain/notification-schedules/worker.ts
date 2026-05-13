import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export interface DispatchSchedulesResult {
  runId: string;
  durationMs: number;
  due: number;
  fired: number;
  skipped: number;
  errors: Array<{ scheduleId: string; message: string }>;
}

/**
 * Lance toutes les planifications dues (`next_run_at <= now AND is_active`).
 *
 * Anti-doublon: chaque tir est enregistré dans `schedule_runs` avec PK
 * composite (schedule_id, run_at). En cas de conflit, on skip → impossible
 * de créer 2 fois la même occurrence, même si deux workers tournent en
 * parallèle (ex: Vercel Cron + GitHub Actions backup).
 *
 * Pour chaque schedule dû:
 *   1) snapshot du `next_run_at` actuel = `run_at` cible
 *   2) INSERT INTO schedule_runs (schedule_id, run_at) ... ON CONFLICT DO NOTHING
 *      → si conflit: occurrence déjà traitée, skip
 *   3) sinon: créer un feed_item miroir (titre/body/category/session/target)
 *      + copier les target junctions
 *   4) UPDATE schedule SET last_run_at = run_at → trigger recalcule next_run_at
 */
export async function dispatchSchedules(): Promise<DispatchSchedulesResult> {
  const runId = crypto.randomUUID();
  const log = logger.child({ runId, scope: "schedules.dispatch" });
  const startedAt = Date.now();
  const supabase = createAdminClient();

  const result: DispatchSchedulesResult = {
    runId,
    durationMs: 0,
    due: 0,
    fired: 0,
    skipped: 0,
    errors: [],
  };

  const nowIso = new Date().toISOString();

  // 1) Récupère les schedules dues + leurs targets + l'état de la session
  // associée (pour pouvoir skip les schedules dont la session est inactive).
  const { data: dueSchedules, error } = await supabase
    .from("notification_schedules")
    .select(
      "*, session:sessions(is_active), target_teams:schedule_target_teams(team_id), target_users:schedule_target_users(user_id)",
    )
    .eq("is_active", true)
    .not("next_run_at", "is", null)
    .lte("next_run_at", nowIso)
    .limit(200);

  if (error) {
    log.error("load.failed", { error: error.message });
    throw new Error(`Loading due schedules failed: ${error.message}`);
  }

  const schedules = (dueSchedules ?? []) as Array<
    Record<string, unknown> & {
      id: string;
      owner_id: string;
      title: string;
      body: string | null;
      kind: "notification" | "reminder";
      category_id: string | null;
      session_id: string | null;
      priority: "low" | "normal" | "high";
      target_mode: "all" | "teams" | "users";
      next_run_at: string;
      session: { is_active: boolean } | null;
      target_teams: Array<{ team_id: string }>;
      target_users: Array<{ user_id: string }>;
    }
  >;

  result.due = schedules.length;
  log.info("due.loaded", { count: schedules.length });

  for (const schedule of schedules) {
    const runAt = schedule.next_run_at;

    // Garde métier : si une session est rattachée et qu'elle est inactive,
    // ne PAS créer la notification. On enregistre quand même le run pour
    // avancer next_run_at et ne pas re-tenter en boucle à la prochaine minute.
    if (schedule.session_id && schedule.session && !schedule.session.is_active) {
      try {
        const { data: claimed } = await supabase
          .from("schedule_runs")
          .insert({ schedule_id: schedule.id, run_at: runAt })
          .select("schedule_id");
        if (claimed && claimed.length > 0) {
          await supabase
            .from("notification_schedules")
            .update({ last_run_at: runAt })
            .eq("id", schedule.id);
        }
      } catch {
        // ignore les conflits sur schedule_runs (déjà avancé par un autre run)
      }
      result.skipped++;
      log.info("skip.session_inactive", {
        scheduleId: schedule.id,
        sessionId: schedule.session_id,
        runAt,
      });
      continue;
    }

    try {
      // 2) Claim: INSERT ON CONFLICT DO NOTHING. .select() pour savoir si on a
      // vraiment inséré ou si on a hit le conflict.
      const { data: claimed, error: claimError } = await supabase
        .from("schedule_runs")
        .insert({ schedule_id: schedule.id, run_at: runAt })
        .select("schedule_id");

      if (claimError) {
        // PK violation = déjà traité par un autre worker
        if (claimError.code === "23505") {
          result.skipped++;
          log.info("skip.already_run", { scheduleId: schedule.id, runAt });
          continue;
        }
        throw claimError;
      }
      if (!claimed || claimed.length === 0) {
        result.skipped++;
        continue;
      }

      // 3) Créer le feed_item miroir
      const { data: feedItem, error: feedError } = await supabase
        .from("feed_items")
        .insert({
          created_by: schedule.owner_id,
          kind: schedule.kind,
          title: schedule.title,
          body: schedule.body,
          category_id: schedule.category_id,
          session_id: schedule.session_id,
          priority: schedule.priority,
          published_at: runAt,
          target_mode: schedule.target_mode,
        })
        .select("id")
        .single();

      if (feedError || !feedItem) {
        throw new Error(`feed_item insert failed: ${feedError?.message ?? "unknown"}`);
      }

      // 3b) Copier les target junctions
      if (schedule.target_mode === "teams" && schedule.target_teams.length > 0) {
        await supabase.from("feed_item_target_teams").insert(
          schedule.target_teams.map((t) => ({
            feed_item_id: feedItem.id,
            team_id: t.team_id,
          })),
        );
      } else if (schedule.target_mode === "users" && schedule.target_users.length > 0) {
        await supabase.from("feed_item_target_users").insert(
          schedule.target_users.map((u) => ({
            feed_item_id: feedItem.id,
            user_id: u.user_id,
          })),
        );
      }

      // 3c) Backfill du feed_item_id sur le run pour audit
      await supabase
        .from("schedule_runs")
        .update({ feed_item_id: feedItem.id })
        .eq("schedule_id", schedule.id)
        .eq("run_at", runAt);

      // 4) Update last_run_at → trigger recalcule next_run_at
      const { error: updError } = await supabase
        .from("notification_schedules")
        .update({ last_run_at: runAt })
        .eq("id", schedule.id);

      if (updError) {
        log.warn("schedule.update_last_run.failed", {
          scheduleId: schedule.id,
          error: updError.message,
        });
      }

      result.fired++;
      log.info("schedule.fired", {
        scheduleId: schedule.id,
        runAt,
        feedItemId: feedItem.id,
        targetMode: schedule.target_mode,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ scheduleId: schedule.id, message });
      log.error("schedule.failed", { scheduleId: schedule.id, runAt, error: message });
    }
  }

  result.durationMs = Date.now() - startedAt;
  log.info("run.done", {
    durationMs: result.durationMs,
    due: result.due,
    fired: result.fired,
    skipped: result.skipped,
    errorCount: result.errors.length,
  });
  return result;
}
