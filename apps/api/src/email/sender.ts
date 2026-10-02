export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

/** All outgoing mail goes through this. The real provider is not chosen yet. */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Development sender: prints the message to the server log so verification
 * and reset links can be copied. Messages contain one-time tokens, so this
 * must never be used in production.
 */
export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    console.log(
      `\n--- email (dev only) ---\nto: ${message.to}\nsubject: ${message.subject}\n\n${message.text}\n------------------------\n`,
    );
  }
}

/** Fails loudly instead of silently dropping mail when no provider is wired. */
export class UnconfiguredEmailSender implements EmailSender {
  async send(): Promise<void> {
    throw new Error("No email provider is configured");
  }
}

export function createEmailSender(nodeEnv: string): EmailSender {
  return nodeEnv === "production"
    ? new UnconfiguredEmailSender()
    : new ConsoleEmailSender();
}
