import type { Message, SendOutcome } from "../../types";

export interface EmailProvider {
  readonly id: string;
  isConfigured(): boolean;
  send(to: string, message: Message): Promise<SendOutcome>;
}
