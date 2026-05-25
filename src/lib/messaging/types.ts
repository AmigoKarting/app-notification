/**
 * Types partagés du système d'envoi multi-canaux.
 *
 * Hiérarchie:
 *   - Channel        — abstraction stable d'un moyen de communication
 *                      (email, sms, whatsapp...). Découplée du provider.
 *   - Provider       — implémentation concrète qui parle à un service
 *                      externe (Resend, Twilio...). Sélectionné par env var.
 *   - notify()       — point d'entrée applicatif: dispatch + persistance.
 */

export type ChannelId = "email" | "sms" | "whatsapp" | "push";

export interface Recipient {
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  /** Identifiant utilisateur (pour audit) */
  userId?: string | null;
  name?: string | null;
}

export interface Message {
  subject: string;
  body: string;
  /** HTML optionnel — utilisé par les canaux qui le supportent (email) */
  htmlBody?: string;
}

export interface SendOutcome {
  /** ID de message renvoyé par le provider (pour suivi côté provider) */
  providerMessageId: string;
  /** Identifiant du provider effectivement utilisé (mock, resend, twilio...) */
  provider: string;
}

/**
 * Une "skip" est différente d'une erreur:
 *  - skip   = canal volontairement non utilisé (ex: pas d'email pour ce destinataire)
 *  - failed = tentative qui a planté (réseau, 4xx provider, etc.)
 */
export class ChannelSkip extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(reason);
    this.name = "ChannelSkip";
    this.reason = reason;
  }
}

export interface NotificationChannel {
  readonly id: ChannelId;
  readonly displayName: string;
  /**
   * Indique si le canal est configuré et utilisable.
   * Ex: pas de RESEND_API_KEY → email channel n'est pas disponible.
   */
  isAvailable(): boolean;
  /** Adresse pertinente sur ce canal pour ce destinataire (ou null) */
  resolveRecipient(recipient: Recipient): string | null;
  /** Envoi effectif. Lève ChannelSkip ou Error en cas de problème. */
  send(to: string, message: Message): Promise<SendOutcome>;
}

export interface DeliveryResult {
  channel: ChannelId;
  status: "sent" | "failed" | "skipped";
  recipient: string | null;
  provider?: string;
  providerMessageId?: string;
  error?: string;
  skipReason?: string;
}

export interface NotifyContext {
  /** Source applicative (ex: 'reminder.cron', 'feed_item') */
  source?: string;
  /** ID de l'entité source (ex: reminders.id, feed_items.id) */
  sourceId?: string;
  /** Métadonnées libres persistées en jsonb */
  metadata?: Record<string, unknown>;
}
