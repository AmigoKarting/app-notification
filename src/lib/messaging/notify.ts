import "server-only";

import { logger } from "@/lib/logger";
import { persistDelivery } from "./persistence";
import { channelRegistry } from "./registry";
import {
  ChannelSkip,
  type ChannelId,
  type DeliveryResult,
  type Message,
  type NotifyContext,
  type Recipient,
} from "./types";

export interface NotifyParams {
  /** Liste ordonnée des canaux à essayer */
  channels: ChannelId[];
  recipient: Recipient;
  message: Message;
  /** Métadonnées d'audit (source, sourceId, ...) */
  context?: NotifyContext;
}

/**
 * Envoie un message sur un ou plusieurs canaux et persiste chaque tentative.
 *
 * Sémantique:
 *  - "sent"    → le provider a accepté le message (≠ délivré, mais c'est tout
 *                ce qu'on peut savoir avant un webhook).
 *  - "failed"  → erreur lors de l'envoi (réseau, 4xx provider, etc.).
 *  - "skipped" → le canal n'est pas applicable (pas d'adresse pertinente sur
 *                le destinataire, ou canal non configuré).
 *
 * Toujours retourne: ne lance jamais. L'appelant inspecte les statuts.
 */
export async function notify(params: NotifyParams): Promise<DeliveryResult[]> {
  const { channels, recipient, message, context } = params;
  const results: DeliveryResult[] = [];

  for (const id of channels) {
    const channel = channelRegistry.get(id);

    if (!channel) {
      const result: DeliveryResult = {
        channel: id,
        status: "skipped",
        recipient: null,
        skipReason: `Canal '${id}' non enregistré`,
      };
      results.push(result);
      logger.warn("messaging.channel.unknown", { channel: id });
      continue;
    }

    const to = channel.resolveRecipient(recipient);
    if (!to) {
      const result: DeliveryResult = {
        channel: id,
        status: "skipped",
        recipient: null,
        skipReason: "Destinataire sans adresse valide pour ce canal",
      };
      results.push(result);
      await persistDelivery({
        channel: id,
        recipient: null,
        message,
        status: "skipped",
        error: result.skipReason,
        context,
        userId: recipient.userId ?? null,
      });
      continue;
    }

    try {
      const outcome = await channel.send(to, message);
      const result: DeliveryResult = {
        channel: id,
        status: "sent",
        recipient: to,
        provider: outcome.provider,
        providerMessageId: outcome.providerMessageId,
      };
      results.push(result);
      await persistDelivery({
        channel: id,
        recipient: to,
        message,
        status: "sent",
        provider: outcome.provider,
        providerMessageId: outcome.providerMessageId,
        context,
        userId: recipient.userId ?? null,
      });
      logger.info("messaging.sent", {
        channel: id,
        provider: outcome.provider,
        providerMessageId: outcome.providerMessageId,
        source: context?.source,
        sourceId: context?.sourceId,
      });
    } catch (err) {
      const isSkip = err instanceof ChannelSkip;
      const errMessage = err instanceof Error ? err.message : String(err);
      const result: DeliveryResult = {
        channel: id,
        status: isSkip ? "skipped" : "failed",
        recipient: to,
        skipReason: isSkip ? errMessage : undefined,
        error: isSkip ? undefined : errMessage,
      };
      results.push(result);
      await persistDelivery({
        channel: id,
        recipient: to,
        message,
        status: result.status,
        error: errMessage,
        context,
        userId: recipient.userId ?? null,
      });
      logger[isSkip ? "warn" : "error"]("messaging.failed", {
        channel: id,
        error: errMessage,
        source: context?.source,
        sourceId: context?.sourceId,
      });
    }
  }

  return results;
}
