import type { EmailMessage } from "./sender.js";

function link(webOrigin: string, path: string, token: string): string {
  const url = new URL(path, webOrigin);
  url.searchParams.set("token", token);
  return url.toString();
}

export function verifyEmailMessage(
  to: string,
  webOrigin: string,
  token: string,
): EmailMessage {
  return {
    to,
    subject: "Verify your seal email address",
    text: `Welcome to seal.\n\nConfirm your email address to finish signing up:\n${link(webOrigin, "/verify-email", token)}\n\nThis link expires in 24 hours. If you did not sign up, ignore this email.`,
  };
}

export function resetPasswordMessage(
  to: string,
  webOrigin: string,
  token: string,
): EmailMessage {
  return {
    to,
    subject: "Reset your seal password",
    text: `Someone asked to reset the password for this account.\n\nChoose a new password:\n${link(webOrigin, "/reset-password", token)}\n\nThis link expires in 1 hour. If this was not you, ignore this email.`,
  };
}
