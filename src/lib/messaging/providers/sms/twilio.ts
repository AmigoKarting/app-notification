import type { Message, SendOutcome } from "../../types";
import type { SmsProvider } from "./types";

/**
 * Provider Twilio (https://www.twilio.com/docs/sms/api).
 * Activé si TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et SMS_FROM
 * sont définis et que SMS_PROVIDER=twilio.
 *
 * Limite: pas d'objet/sujet sur les SMS — on n'envoie que message.body.
 */
export class TwilioSmsProvider implements SmsProvider {
  readonly id = "twilio";

  isConfigured(): boolean {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.SMS_FROM,
    );
  }

  async send(to: string, message: Message): Promise<SendOutcome> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.SMS_FROM;
    if (!sid || !token || !from) {
      throw new Error("Twilio non configuré");
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const body = new URLSearchParams({
      From: from,
      To: to,
      Body: message.body,
    });
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Twilio ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as { sid?: string };
    return {
      provider: this.id,
      providerMessageId: data.sid ?? `twilio_${Date.now()}`,
    };
  }
}
