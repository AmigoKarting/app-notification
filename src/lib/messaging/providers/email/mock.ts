import { logger } from "@/lib/logger";
import type { Message, SendOutcome } from "../../types";
import type { EmailProvider } from "./types";

export class MockEmailProvider implements EmailProvider {
  readonly id = "mock";

  isConfigured(): boolean {
    return true;
  }

  async send(to: string, message: Message): Promise<SendOutcome> {
    const failRate = Number(process.env.EMAIL_MOCK_FAIL_RATE ?? "0");
    if (failRate > 0 && Math.random() < failRate) {
      throw new Error("Mock email failure (simulated)");
    }

    logger.info("messaging.email.mock", {
      to,
      subject: message.subject,
      preview: message.body.slice(0, 80),
    });

    return {
      provider: this.id,
      providerMessageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }
}
