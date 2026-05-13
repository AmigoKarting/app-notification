import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { notify, type ChannelId } from "@/lib/messaging";
import type { Database } from "@/lib/supabase/database.types";

type Reminder = Database["public"]["Tables"]["reminders"]["Row"];

export interface DispatchOptions {
  batchSize?: number;
  maxAttempts?: number;
  staleAfterMinutes?: number;
  /** Canaux à utiliser pour ce run. Défaut: ['email']. */
  channels?: ChannelId[];
}

export interface DispatchResult {
  runId: string;
  durationMs: number;
  claimed: number;
  sent: number;
  failed: number;
  permanentlyFailed: number;
  errors: Array<{ reminderId: string; message: string }>;
}

const DEFAULTS = {
  batchSize: 50,
  maxAttempts: 5,
  staleAfterMinutes: 15,
  channels: ["email"] as ChannelId[],
};

export async function dispatchReminders(
  opts: DispatchOptions = {},
): Promise<DispatchResult> {
  const { batchSize, maxAttempts, staleAfterMinutes, channels } = { ...DEFAULTS, ...opts };
  const runId = crypto.randomUUID();
  const log = logger.child({ runId, scope: "reminders.dispatch" });
  const startedAt = Date.now();

  const supabase = createAdminClient();

  // --- 1) CLAIM ----------------------------------------------------
  const { data: claimed, error: claimError } = await supabase.rpc("claim_due_reminders" as never, {
    batch_size: batchSize,
    max_attempts: maxAttempts,
    stale_after_minutes: staleAfterMinutes,
  });

  if (claimError) {
    log.error("claim.failed", { error: claimError.message });
    throw new Error(`claim_due_reminders failed: ${claimError.message}`);
  }

  const reminders = (claimed ?? []) as Reminder[];
  log.info("claim.ok", { count: reminders.length, channels, batchSize });

  const result: DispatchResult = {
    runId,
    durationMs: 0,
    claimed: reminders.length,
    sent: 0,
    failed: 0,
    permanentlyFailed: 0,
    errors: [],
  };

  if (reminders.length === 0) {
    result.durationMs = Date.now() - startedAt;
    return result;
  }

  // --- 2) NOTIFY each ---------------------------------------------
  for (const reminder of reminders) {
    try {
      const { data: employee, error: empError } = await supabase
        .from("employees")
        .select("id, email, name, phone")
        .eq("id", reminder.employee_id)
        .maybeSingle();

      if (empError) throw new Error(`employee lookup failed: ${empError.message}`);
      if (!employee) throw new Error("employee not found");

      const deliveries = await notify({
        channels,
        recipient: {
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          userId: reminder.user_id,
        },
        message: {
          subject: "Rappel",
          body: reminder.message,
        },
        context: {
          source: "reminder.cron",
          sourceId: reminder.id,
          metadata: { attempts: reminder.attempts },
        },
      });

      // Le rappel est considéré OK dès qu'au moins un canal a été envoyé.
      const anySent = deliveries.some((d) => d.status === "sent");

      if (!anySent) {
        const errors = deliveries
          .filter((d) => d.status !== "sent")
          .map((d) => `${d.channel}:${d.error ?? d.skipReason ?? "?"}`)
          .join(" | ");
        throw new Error(errors || "no channel delivered");
      }

      const { error: updateError } = await supabase
        .from("reminders")
        .update({ status: "sent", last_error: null, claimed_at: null })
        .eq("id", reminder.id);

      if (updateError) {
        log.error("mark_sent.failed", { reminderId: reminder.id, error: updateError.message });
        throw updateError;
      }

      result.sent++;
      log.info("reminder.sent", {
        reminderId: reminder.id,
        employeeId: employee.id,
        attempts: reminder.attempts,
        deliveries: deliveries.map((d) => ({ channel: d.channel, status: d.status })),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isPermanent = reminder.attempts >= maxAttempts;
      result.failed++;
      if (isPermanent) result.permanentlyFailed++;
      result.errors.push({ reminderId: reminder.id, message });

      const { error: updateError } = await supabase
        .from("reminders")
        .update({
          status: isPermanent ? "failed" : "pending",
          last_error: message.slice(0, 500),
          claimed_at: null,
        })
        .eq("id", reminder.id);

      if (updateError) {
        log.error("mark_failed.failed", {
          reminderId: reminder.id,
          error: updateError.message,
        });
      }

      log[isPermanent ? "error" : "warn"]("reminder.failed", {
        reminderId: reminder.id,
        attempts: reminder.attempts,
        permanent: isPermanent,
        error: message,
      });
    }
  }

  result.durationMs = Date.now() - startedAt;
  log.info("run.done", {
    durationMs: result.durationMs,
    sent: result.sent,
    failed: result.failed,
    permanentlyFailed: result.permanentlyFailed,
  });

  return result;
}
