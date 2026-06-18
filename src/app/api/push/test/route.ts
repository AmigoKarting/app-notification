import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const strip = (s?: string) => s?.replace(/[﻿​]/g, "").trim();
  const publicKey = strip(process.env.VAPID_PUBLIC_KEY);
  const privateKey = strip(process.env.VAPID_PRIVATE_KEY);
  const subject = strip(process.env.VAPID_SUBJECT) ?? "mailto:noreply@example.com";

  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "VAPID keys missing" }, { status: 503 });
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const supabase = createAdminClient();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, user_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json({ error: "Aucun abonnement push trouvé" }, { status: 404 });
  }

  const payload = JSON.stringify({
    title: "Test Amigo Karting",
    body: "Les notifications push fonctionnent!",
    icon: "/icon-pwa-192.png",
    badge: "/icon-pwa-192.png",
    data: { url: "/" },
  });

  const results = [];
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      results.push({ user_id: sub.user_id, status: "sent" });
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      results.push({ user_id: sub.user_id, status: "error", code: statusCode });
    }
  }

  return NextResponse.json({ sent: results });
}
