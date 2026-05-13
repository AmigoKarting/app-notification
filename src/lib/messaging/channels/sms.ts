import {
  ChannelSkip,
  type Message,
  type NotificationChannel,
  type Recipient,
  type SendOutcome,
} from "../types";
import { MockSmsProvider } from "../providers/sms/mock";
import { TwilioSmsProvider } from "../providers/sms/twilio";
import type { SmsProvider } from "../providers/sms/types";

const E164_RE = /^\+[1-9]\d{6,14}$/;

export class SmsChannel implements NotificationChannel {
  readonly id = "sms" as const;
  readonly displayName = "SMS";

  private providerCache: SmsProvider | null = null;

  private getProvider(): SmsProvider {
    if (this.providerCache) return this.providerCache;
    const requested = (process.env.SMS_PROVIDER ?? "mock").toLowerCase();
    let provider: SmsProvider;
    switch (requested) {
      case "twilio": {
        provider = new TwilioSmsProvider();
        break;
      }
      case "mock":
      default: {
        provider = new MockSmsProvider();
        break;
      }
    }
    this.providerCache = provider;
    return provider;
  }

  isAvailable(): boolean {
    return this.getProvider().isConfigured();
  }

  resolveRecipient(recipient: Recipient): string | null {
    const phone = recipient.phone?.trim().replace(/\s+/g, "");
    if (!phone) return null;
    return E164_RE.test(phone) ? phone : null;
  }

  async send(to: string, message: Message): Promise<SendOutcome> {
    const provider = this.getProvider();
    if (!provider.isConfigured()) {
      throw new ChannelSkip("Provider SMS non configuré");
    }
    return provider.send(to, message);
  }
}
