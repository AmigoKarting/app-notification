import type { ChannelId, NotificationChannel } from "./types";

/**
 * Registre singleton des canaux disponibles dans l'app.
 * Le bootstrap (channels enregistrés) se fait dans index.ts une seule fois.
 */
class ChannelRegistry {
  private channels = new Map<ChannelId, NotificationChannel>();

  register(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
  }

  get(id: ChannelId): NotificationChannel | undefined {
    return this.channels.get(id);
  }

  list(): NotificationChannel[] {
    return Array.from(this.channels.values());
  }

  available(): NotificationChannel[] {
    return this.list().filter((c) => c.isAvailable());
  }
}

export const channelRegistry = new ChannelRegistry();
