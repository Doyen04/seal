import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { KeyProvider } from "./key-provider.js";

const DEK_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/** Binds a ciphertext to the secret it belongs to (used as GCM AAD). */
export interface SecretContext {
  environmentId: string;
  secretId: string;
  key: string;
}

/** The fields stored in the database for one encrypted value. */
export interface EncryptedPayload {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  wrappedDek: Buffer;
  masterKeyId: string;
}

/**
 * Thrown for any decryption failure. The message is deliberately generic so
 * nothing about the key material or payload leaks.
 */
export class DecryptionError extends Error {
  constructor() {
    super("Decryption failed");
    this.name = "DecryptionError";
  }
}

function aad(ctx: SecretContext): Buffer {
  return Buffer.from(`${ctx.environmentId}:${ctx.secretId}:${ctx.key}`, "utf8");
}

export async function encryptValue(
  provider: KeyProvider,
  plaintext: string,
  ctx: SecretContext,
): Promise<EncryptedPayload> {
  const dek = randomBytes(DEK_LENGTH);
  try {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv("aes-256-gcm", dek, iv, {
      authTagLength: TAG_LENGTH,
    });
    cipher.setAAD(aad(ctx));
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const { wrapped, keyId } = await provider.wrap(dek);
    return {
      ciphertext,
      iv,
      authTag,
      wrappedDek: wrapped,
      masterKeyId: keyId,
    };
  } finally {
    dek.fill(0);
  }
}

export async function decryptValue(
  provider: KeyProvider,
  payload: EncryptedPayload,
  ctx: SecretContext,
): Promise<string> {
  let dek: Buffer | undefined;
  try {
    if (
      payload.iv.length !== IV_LENGTH ||
      payload.authTag.length !== TAG_LENGTH
    ) {
      throw new Error("bad payload");
    }
    dek = await provider.unwrap(payload.wrappedDek, payload.masterKeyId);
    const decipher = createDecipheriv("aes-256-gcm", dek, payload.iv, {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAAD(aad(ctx));
    decipher.setAuthTag(payload.authTag);
    const plaintext = Buffer.concat([
      decipher.update(payload.ciphertext),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch {
    throw new DecryptionError();
  } finally {
    dek?.fill(0);
  }
}
