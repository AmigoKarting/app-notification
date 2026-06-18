import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const raw = process.env.VAPID_PUBLIC_KEY ?? "";
  const key = raw.replace(/[﻿​]/g, "").trim();
  if (!key) {
    return NextResponse.json(
      { error: "VAPID non configuré", hint: "VAPID_PUBLIC_KEY env var is missing" },
      { status: 503 },
    );
  }
  return NextResponse.json({ publicKey: key });
}
