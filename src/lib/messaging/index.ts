import "server-only";

import { EmailChannel } from "./channels/email";
import { WebPushChannel } from "./channels/push";
import { SmsChannel } from "./channels/sms";
import { channelRegistry } from "./registry";

/**
 * Bootstrap des canaux disponibles.
 *
 * Pour ajouter WhatsApp plus tard:
 *   1. Créer src/lib/messaging/providers/whatsapp/{types,mock,twilio-wa}.ts
 *   2. Créer src/lib/messaging/channels/whatsapp.ts (NotificationChannel)
 *   3. Ajouter ici:    channelRegistry.register(new WhatsappChannel());
 *   4. Ajouter 'whatsapp' à ChannelId dans types.ts
 *   5. Ajouter le case dans la migration enum si besoin (déjà inclus)
 *
 * Les appelants utilisent le `channels` array dans notify({...}) — aucune
 * autre modification nécessaire dans le code applicatif.
 */
let bootstrapped = false;
function bootstrap(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  channelRegistry.register(new EmailChannel());
  channelRegistry.register(new SmsChannel());
  channelRegistry.register(new WebPushChannel());
  // channelRegistry.register(new WhatsappChannel()); // futur
}
bootstrap();

export { notify } from "./notify";
export { channelRegistry } from "./registry";
export type {
  ChannelId,
  DeliveryResult,
  Message,
  NotificationChannel,
  NotifyContext,
  Recipient,
  SendOutcome,
} from "./types";
