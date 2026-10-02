import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export interface KeyProvider {
    currentKeyId(): string;
    wrap(dek: Buffer): Promise<{ wrapped: Buffer; keyId: string }>;
    unwrap(wrapped: Buffer, keyId: string): Promise<Buffer>;
}

const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export interface EnvKeyProviderConfig {
    /** Map of key id to base64-encoded 32-byte master key. */
    keys: Record<string, string>;
    /** Key id used for new writes. Must exist in `keys`. */
    current: string;
}

/**
 * Master keys held in memory, loaded from environment variables.
 * Wrapped blob layout: iv(12) | tag(16) | ciphertext.
 */
export class EnvKeyProvider implements KeyProvider {
    private readonly keys = new Map<string, Buffer>();
    private readonly current: string;

    constructor(config: EnvKeyProviderConfig) {
        for (const [id, encoded] of Object.entries(config.keys)) {
            const key = Buffer.from(encoded, "base64");
            if (key.length !== KEY_LENGTH) {
                throw new Error(`Master key "${id}" must decode to ${KEY_LENGTH} bytes`);
            }
            this.keys.set(id, key);
        }
        if (!this.keys.has(config.current)) {
            throw new Error(`Current master key "${config.current}" is not defined`);
        }
        this.current = config.current;
    }

    /** Reads `MASTER_KEYS` (JSON) and `MASTER_KEY_CURRENT`. */
    static fromEnv(env: Record<string, string | undefined> = process.env): EnvKeyProvider {
        const rawKeys = env.MASTER_KEYS;
        const current = env.MASTER_KEY_CURRENT;
        if (!rawKeys || !current) {
            throw new Error("MASTER_KEYS and MASTER_KEY_CURRENT must be set");
        }
        let keys: unknown;
        try {
            keys = JSON.parse(rawKeys);
        } catch {
            throw new Error("MASTER_KEYS must be valid JSON");
        }
        if (typeof keys !== "object" || keys === null || Array.isArray(keys)) {
            throw new Error("MASTER_KEYS must be a JSON object");
        }
        for (const value of Object.values(keys)) {
            if (typeof value !== "string") {
                throw new Error("MASTER_KEYS values must be base64 strings");
            }
        }
        return new EnvKeyProvider({
            keys: keys as Record<string, string>,
            current,
        });
    }

    currentKeyId(): string {
        return this.current;
    }

    async wrap(dek: Buffer): Promise<{ wrapped: Buffer; keyId: string }> {
        const key = this.keys.get(this.current) as Buffer;
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv("aes-256-gcm", key, iv, {
            authTagLength: TAG_LENGTH,
        });
        const ciphertext = Buffer.concat([cipher.update(dek), cipher.final()]);
        const tag = cipher.getAuthTag();
        return {
            wrapped: Buffer.concat([iv, tag, ciphertext]),
            keyId: this.current,
        };
    }

    async unwrap(wrapped: Buffer, keyId: string): Promise<Buffer> {
        const key = this.keys.get(keyId);
        if (!key) {
            throw new Error("Unknown master key id");
        }
        if (wrapped.length <= IV_LENGTH + TAG_LENGTH) {
            throw new Error("Wrapped key is malformed");
        }
        const iv = wrapped.subarray(0, IV_LENGTH);
        const tag = wrapped.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
        const ciphertext = wrapped.subarray(IV_LENGTH + TAG_LENGTH);
        const decipher = createDecipheriv("aes-256-gcm", key, iv, {
            authTagLength: TAG_LENGTH,
        });
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    }
}
