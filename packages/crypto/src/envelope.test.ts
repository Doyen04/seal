import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  DecryptionError,
  EnvKeyProvider,
  decryptValue,
  encryptValue,
  type EncryptedPayload,
  type SecretContext,
} from "./index.js";

const b64 = () => randomBytes(32).toString("base64");

const ctx: SecretContext = {
  environmentId: "env-1",
  secretId: "secret-1",
  key: "STRIPE_KEY",
};

function provider(current = "k1") {
  return new EnvKeyProvider({ keys: { k1: b64(), k2: b64() }, current });
}

async function sealed(p: EnvKeyProvider, value = "sk_live_123") {
  return encryptValue(p, value, ctx);
}

function flip(buf: Buffer): Buffer {
  const copy = Buffer.from(buf);
  copy[0] = (copy[0] as number) ^ 0xff;
  return copy;
}

describe("envelope encryption", () => {
  it("round trips, including unicode and empty values", async () => {
    const p = provider();
    for (const value of ["sk_live_123", "päss wörd 🔐", ""]) {
      const payload = await sealed(p, value);
      expect(await decryptValue(p, payload, ctx)).toBe(value);
    }
  });

  it("does not store the plaintext in any field", async () => {
    const p = provider();
    const payload = await sealed(p, "very-secret-value");
    for (const field of [
      payload.ciphertext,
      payload.iv,
      payload.authTag,
      payload.wrappedDek,
    ]) {
      expect(field.toString("utf8")).not.toContain("very-secret-value");
    }
  });

  it("uses a fresh IV and DEK for every write", async () => {
    const p = provider();
    const a = await sealed(p);
    const b = await sealed(p);
    expect(a.iv.equals(b.iv)).toBe(false);
    expect(a.wrappedDek.equals(b.wrappedDek)).toBe(false);
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false);
  });

  describe("tampering", () => {
    const cases: Array<[string, (p: EncryptedPayload) => EncryptedPayload]> = [
      ["ciphertext", (p) => ({ ...p, ciphertext: flip(p.ciphertext) })],
      ["iv", (p) => ({ ...p, iv: flip(p.iv) })],
      ["auth tag", (p) => ({ ...p, authTag: flip(p.authTag) })],
      ["wrapped dek", (p) => ({ ...p, wrappedDek: flip(p.wrappedDek) })],
    ];

    for (const [name, mutate] of cases) {
      it(`fails when the ${name} is modified`, async () => {
        const p = provider();
        const payload = await sealed(p);
        await expect(decryptValue(p, mutate(payload), ctx)).rejects.toThrow(
          DecryptionError,
        );
      });
    }

    const aadCases: Array<[string, SecretContext]> = [
      ["environment id", { ...ctx, environmentId: "env-2" }],
      ["secret id", { ...ctx, secretId: "secret-2" }],
      ["key", { ...ctx, key: "OTHER_KEY" }],
    ];

    for (const [name, wrongCtx] of aadCases) {
      it(`fails when the AAD ${name} differs`, async () => {
        const p = provider();
        const payload = await sealed(p);
        await expect(decryptValue(p, payload, wrongCtx)).rejects.toThrow(
          DecryptionError,
        );
      });
    }
  });

  it("decrypts old rows after the current master key rotates", async () => {
    const keys = { k1: b64(), k2: b64() };
    const before = new EnvKeyProvider({ keys, current: "k1" });
    const payload = await sealed(before, "rotate-me");
    expect(payload.masterKeyId).toBe("k1");

    const after = new EnvKeyProvider({ keys, current: "k2" });
    expect(await decryptValue(after, payload, ctx)).toBe("rotate-me");

    const fresh = await sealed(after, "new-write");
    expect(fresh.masterKeyId).toBe("k2");
  });

  it("fails with the wrong master key", async () => {
    const writer = new EnvKeyProvider({ keys: { k1: b64() }, current: "k1" });
    const reader = new EnvKeyProvider({ keys: { k1: b64() }, current: "k1" });
    const payload = await sealed(writer);
    await expect(decryptValue(reader, payload, ctx)).rejects.toThrow(
      DecryptionError,
    );
  });

  it("fails when the master key id is unknown", async () => {
    const p = provider();
    const payload = await sealed(p);
    await expect(
      decryptValue(p, { ...payload, masterKeyId: "missing" }, ctx),
    ).rejects.toThrow(DecryptionError);
  });
});

describe("EnvKeyProvider", () => {
  it("rejects keys that are not 32 bytes", () => {
    expect(
      () =>
        new EnvKeyProvider({
          keys: { k1: randomBytes(16).toString("base64") },
          current: "k1",
        }),
    ).toThrow();
  });

  it("rejects an undefined current key", () => {
    expect(
      () => new EnvKeyProvider({ keys: { k1: b64() }, current: "nope" }),
    ).toThrow();
  });

  it("loads from environment variables", () => {
    const p = EnvKeyProvider.fromEnv({
      MASTER_KEYS: JSON.stringify({ k1: b64() }),
      MASTER_KEY_CURRENT: "k1",
    });
    expect(p.currentKeyId()).toBe("k1");
  });

  it("throws on missing or invalid environment variables", () => {
    expect(() => EnvKeyProvider.fromEnv({})).toThrow();
    expect(() =>
      EnvKeyProvider.fromEnv({
        MASTER_KEYS: "not json",
        MASTER_KEY_CURRENT: "k1",
      }),
    ).toThrow();
  });
});
