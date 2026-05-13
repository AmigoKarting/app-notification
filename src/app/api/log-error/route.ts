import { NextResponse } from "next/server";
import { z } from "zod";
import { reportError } from "@/lib/error-reporter";
import { getCurrentUser } from "@/domain/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  message: z.string().max(2000),
  stack: z.string().max(10000).optional(),
  digest: z.string().max(200).optional(),
  url: z.string().max(2000).optional(),
});

/**
 * Reçoit les erreurs runtime du client (depuis error.tsx).
 * Non sensible mais on garde une vérif de format pour éviter le spam.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const user = await getCurrentUser();

  reportError({
    scope: "client",
    message: parsed.data.message,
    stack: parsed.data.stack,
    digest: parsed.data.digest,
    url: parsed.data.url,
    userId: user?.id ?? null,
  });

  return NextResponse.json({ ok: true });
}
