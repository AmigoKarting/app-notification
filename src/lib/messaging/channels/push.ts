import webpush from "web-push";
import {
  ChannelSkip,
  type Message,
  type NotificationChannel,
  type Recipient,
  type SendOutcome,
} from "../types";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export class WebPushChannel implements NotificationChannel {
  readonly id = "push" as const;
  readonly displayName = "Push";

  private configured = false;
  private initialized = false;

  private init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const strip = (s?: string) => s?.replace(/[﻿​]/g, "").trim();
    const publicKey = strip(process.env.VAPID_PUBLIC_KEY);
    const privateKey = strip(process.env.VAPID_PRIVATE_KEY);
    const subject = strip(process.env.VAPID_SUBJECT) ?? "mailto:noreply@example.com";

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.configured = true;
    }
  }

  isAvailable(): boolean {
    this.init();
    return this.configured;
  }

  resolveRecipient(recipient: Recipient): string | null {
    return recipient.userId ?? null;
  }

  async send(userId: string, message: Message): Promise<SendOutcome> {
    this.init();
    if (!this.configured) {
      throw new ChannelSkip("VAPID keys non configurées");
    }

    const supabase = createAdminClient();
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Erreur DB push_subscriptions: ${error.message}`);
    }

    if (!subs || subs.length === 0) {
      throw new ChannelSkip("Aucun abonnement push pour cet utilisateur");
    }

    const payload = JSON.stringify({
      title: message.subject,
      body: message.body,
      icon: "/icon-pwa-192.png",
      badge: "/icon-pwa-192.png",
      data: { url: "/" },
    });

    let sentCount = 0;
    const staleIds: string[] = [];

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        try {
          await webpush.sendNotification(pushSub, payload);
          sentCount++;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            staleIds.push(sub.id);
          } else {
            logger.warn("push.send.error", {
              endpoint: sub.endpoint,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      })
    );
    void results;

    if (staleIds.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", staleIds);
    }

    if (sentCount === 0) {
      throw new Error("Aucune notification push délivrée");
    }

    return {
      providerMessageId: `push-${sentCount}-of-${subs.length}`,
      provider: "web-push",
    };
  }
}
