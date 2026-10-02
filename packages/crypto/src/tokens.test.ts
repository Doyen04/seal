import { describe, expect, it } from "vitest";
import {
  generateToken,
  hashesEqual,
  hashToken,
  tokenKindFromPrefix,
  tokenLast4,
  tokenPrefix,
} from "./index.js";

describe("tokens", () => {
  it("applies the right prefix per kind", () => {
    expect(generateToken("service").token.startsWith("seal_live_")).toBe(true);
    expect(generateToken("device").token.startsWith("seald_")).toBe(true);
    expect(generateToken("session").token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateToken("email").token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("generates unique tokens", () => {
    const seen = new Set(
      Array.from({ length: 50 }, () => generateToken("session").token),
    );
    expect(seen.size).toBe(50);
  });

  it("hashes with sha256 hex and never equals the plaintext", () => {
    const { token, hash } = generateToken("service");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toContain(token);
  });

  it("matches a known sha256 vector", () => {
    expect(hashToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("compares hashes in constant time and rejects mismatches", () => {
    const a = hashToken("one");
    expect(hashesEqual(a, hashToken("one"))).toBe(true);
    expect(hashesEqual(a, hashToken("two"))).toBe(false);
    expect(hashesEqual(a, "")).toBe(false);
    expect(hashesEqual(a, "abcd")).toBe(false);
  });

  it("derives display helpers", () => {
    const { token } = generateToken("service");
    expect(tokenPrefix(token)).toBe(token.slice(0, 12));
    expect(tokenLast4(token)).toBe(token.slice(-4));
  });

  it("detects token kind from the prefix", () => {
    expect(tokenKindFromPrefix(generateToken("service").token)).toBe("service");
    expect(tokenKindFromPrefix(generateToken("device").token)).toBe("device");
    expect(tokenKindFromPrefix(generateToken("session").token)).toBeNull();
  });
});
