import type { EmailTokenType } from "@repo/core";
import { generateToken, hashToken } from "@repo/crypto";
import { and, eq, emailTokens, gt, isNull, type Database } from "@repo/db";

export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Creates a one-time token and returns the plaintext (only the hash is stored). */
export async function createEmailToken(
  db: Database,
  userId: string,
  type: EmailTokenType,
  ttlMs: number,
): Promise<string> {
  const { token, hash } = generateToken("email");
  await db.insert(emailTokens).values({
    userId,
    type,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return token;
}

/**
 * Atomically marks a valid, unused token as used and returns its user id.
 * Returns null if the token is unknown, wrong type, used, or expired.
 */
export async function consumeEmailToken(
  db: Database,
  token: string,
  type: EmailTokenType,
): Promise<string | null> {
  const [row] = await db
    .update(emailTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(emailTokens.tokenHash, hashToken(token)),
        eq(emailTokens.type, type),
        isNull(emailTokens.usedAt),
        gt(emailTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: emailTokens.userId });
  return row?.userId ?? null;
}
