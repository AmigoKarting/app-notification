/// <reference lib="deno.ns" />
//
// Alternative à la route Next.js: même logique, mais déployée comme
// Supabase Edge Function (Deno). Utile si tu veux garder tout chez
// Supabase et déclencher depuis pg_cron via `net.http_post`.
//
// Déploiement:
//   supabase functions deploy dispatch-reminders --no-verify-jwt
//   supabase secrets set CRON_SECRET=xxxx
//
// Invocation:
//   curl -X POST https://<project>.functions.supabase.co/dispatch-reminders \
//        -H "Authorization: Bearer $CRON_SECRET"

// @ts-ignore — Deno std import resolved at runtime by Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

interface Reminder {
  id: string;
  user_id: string;
  employee_id: string;
  message: string;
  scheduled_at: string;
  status: "pending" | "sent" | "cancelled" | "failed";
  attempts: number;
  claimed_at: string | null;
  last_error: string | null;
  last_attempt_at: string | null;
  created_at: string;
  updated_at: string;
}

const MAX_ATTEMPTS = 5;

function log(level: "info" | "warn" | "error", message: string, ctx: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, message, ...ctx }));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function mockSendEmail(to: string, message: string): Promise<{ id: string }> {
  const failRate = Number(Deno.env.get("EMAIL_MOCK_FAIL_RATE") ?? "0");
  if (failRate > 0 && Math.random() < failRate) {
    throw new Error("Mock email failure (simulated)");
  }
  log("info", "email.sent", { provider: "mock", to, preview: message.slice(0, 80) });
  return { id: `mock_${Date.now()}` };
}

Deno.serve(async (req) => {
  // ---- Auth ---------------------------------------------------------
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) {
    log("error", "cron.misconfigured", { reason: "CRON_SECRET missing" });
    return new Response(JSON.stringify({ error: "misconfigured" }), { status: 500 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (!timingSafeEqual(auth, `Bearer ${secret}`)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  // ---- Supabase admin client ---------------------------------------
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ error: "supabase env missing" }), { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const runId = crypto.randomUUID();
  const startedAt = Date.now();

  // ---- 1) Claim atomique --------------------------------------------
  const { data: claimed, error: claimError } = await supabase.rpc("claim_due_reminders", {
    batch_size: 50,
    max_attempts: MAX_ATTEMPTS,
    stale_after_minutes: 15,
  });

  if (claimError) {
    log("error", "claim.failed", { runId, error: claimError.message });
    return new Response(JSON.stringify({ ok: false, error: claimError.message }), { status: 500 });
  }

  const reminders = (claimed ?? []) as Reminder[];
  log("info", "claim.ok", { runId, count: reminders.length });

  // ---- 2) Envoi + update --------------------------------------------
  let sent = 0;
  let failed = 0;
  let permanentlyFailed = 0;

  for (const r of reminders) {
    try {
      const { data: employee, error: empErr } = await supabase
        .from("employees")
        .select("email")
        .eq("id", r.employee_id)
        .maybeSingle();

      if (empErr) throw new Error(`employee lookup: ${empErr.message}`);
      if (!employee) throw new Error("employee not found");

      await mockSendEmail(employee.email, r.message);

      const { error: upErr } = await supabase
        .from("reminders")
        .update({ status: "sent", last_error: null, claimed_at: null })
        .eq("id", r.id);

      if (upErr) throw upErr;
      sent++;
      log("info", "reminder.sent", { runId, reminderId: r.id, attempts: r.attempts });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isPermanent = r.attempts >= MAX_ATTEMPTS;
      failed++;
      if (isPermanent) permanentlyFailed++;

      await supabase
        .from("reminders")
        .update({
          status: isPermanent ? "failed" : "pending",
          last_error: msg.slice(0, 500),
          claimed_at: null,
        })
        .eq("id", r.id);

      log(isPermanent ? "error" : "warn", "reminder.failed", {
        runId,
        reminderId: r.id,
        attempts: r.attempts,
        permanent: isPermanent,
        error: msg,
      });
    }
  }

  const durationMs = Date.now() - startedAt;
  log("info", "run.done", { runId, sent, failed, permanentlyFailed, durationMs });

  return new Response(
    JSON.stringify({
      ok: true,
      runId,
      claimed: reminders.length,
      sent,
      failed,
      permanentlyFailed,
      durationMs,
    }),
    { headers: { "content-type": "application/json" } },
  );
});
