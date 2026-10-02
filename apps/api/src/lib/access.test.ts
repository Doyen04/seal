import type { AccessOverride, Role } from "@repo/core";
import { describe, expect, it } from "vitest";
import { accessAtLeast, computeAccess, computeServiceTokenAccess, roleAtLeast, type AccessLevel } from "./access.js";

type Row = [Role | null, AccessOverride | null, AccessLevel];

// Full matrix: every role crossed with every override.
const MATRIX: Row[] = [
    // not a member
    [null, null, "none"],
    [null, "none", "none"],
    [null, "read", "none"],
    [null, "write", "none"],
    // viewer
    ["viewer", null, "read"],
    ["viewer", "none", "none"],
    ["viewer", "read", "read"],
    ["viewer", "write", "write"],
    // editor
    ["editor", null, "write"],
    ["editor", "none", "none"],
    ["editor", "read", "read"],
    ["editor", "write", "write"],
    // admin: overrides never apply
    ["admin", null, "admin"],
    ["admin", "none", "admin"],
    ["admin", "read", "admin"],
    ["admin", "write", "admin"],
    // owner: overrides never apply
    ["owner", null, "admin"],
    ["owner", "none", "admin"],
    ["owner", "read", "admin"],
    ["owner", "write", "admin"],
];

describe("computeAccess", () => {
    for (const [role, override, expected] of MATRIX) {
        it(`role=${role} override=${override} -> ${expected}`, () => {
            expect(computeAccess(role, override)).toBe(expected);
        });
    }
});

describe("computeServiceTokenAccess", () => {
    it("grants read on the token's own environment", () => {
        expect(computeServiceTokenAccess("env-1", "env-1")).toBe("read");
    });

    it("grants nothing on any other environment", () => {
        expect(computeServiceTokenAccess("env-1", "env-2")).toBe("none");
    });
});

describe("ordering helpers", () => {
    it("orders access levels", () => {
        expect(accessAtLeast("admin", "write")).toBe(true);
        expect(accessAtLeast("write", "write")).toBe(true);
        expect(accessAtLeast("read", "write")).toBe(false);
        expect(accessAtLeast("none", "read")).toBe(false);
    });

    it("orders roles", () => {
        expect(roleAtLeast("owner", "admin")).toBe(true);
        expect(roleAtLeast("admin", "admin")).toBe(true);
        expect(roleAtLeast("editor", "admin")).toBe(false);
        expect(roleAtLeast("viewer", "editor")).toBe(false);
    });
});
