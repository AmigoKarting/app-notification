import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  console.log("[vapid-key] VAPID_PUBLIC_KEY present:", !!key, "length:", key?.length ?? 0);
  if (!key) {
    return NextResponse.json(
      { error: "VAPID non configuré", hint: "VAPID_PUBLIC_KEY env var is missing" },
      { status: 503 },
    );
  }
  return NextResponse.json({ publicKey: key });
}
