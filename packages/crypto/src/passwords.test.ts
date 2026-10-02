import { describe, expect, it } from "vitest";
import {
  hashPassword,
  validatePassword,
  verifyPassword,
} from "./index.js";

describe("validatePassword", () => {
  it("accepts a strong password", () => {
    expect(validatePassword("correct horse battery staple")).toEqual({
      ok: true,
    });
  });

  it("rejects passwords shorter than 10 characters", () => {
    expect(validatePassword("short-pw9")).toEqual({
      ok: false,
      reason: "too_short",
    });
  });

  it("accepts exactly 10 characters", () => {
    expect(validatePassword("k7#Qm2$Zx9")).toEqual({ ok: true });
  });

  it("rejects common passwords case-insensitively", () => {
    expect(validatePassword("Password123")).toEqual({
      ok: false,
      reason: "too_common",
    });
    expect(validatePassword("QWERTYUIOP")).toEqual({
      ok: false,
      reason: "too_common",
    });
  });

  it("rejects absurdly long passwords", () => {
    expect(validatePassword("a1".repeat(600))).toEqual({
      ok: false,
      reason: "too_long",
    });
  });
});

describe("password hashing", () => {
  it("produces an argon2id hash with the pinned parameters", async () => {
    const hashed = await hashPassword("correct horse battery staple");
    expect(hashed.startsWith("$argon2id$")).toBe(true);
    expect(hashed).toContain("m=19456,t=2,p=1");
    expect(hashed).not.toContain("correct horse");
  });

  it("verifies the right password and rejects the wrong one", async () => {
    const hashed = await hashPassword("correct horse battery staple");
    expect(await verifyPassword(hashed, "correct horse battery staple")).toBe(
      true,
    );
    expect(await verifyPassword(hashed, "wrong horse battery staple")).toBe(
      false,
    );
  });

  it("salts every hash", async () => {
    const a = await hashPassword("correct horse battery staple");
    const b = await hashPassword("correct horse battery staple");
    expect(a).not.toBe(b);
  });

  it("returns false for a malformed hash instead of throwing", async () => {
    expect(await verifyPassword("not-a-hash", "whatever-password")).toBe(false);
  });
});
