import { describe, expect, it } from "vitest";
import { newId } from "./id";

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("newId", () => {
    it("returns a valid UUIDv7", () => {
        expect(newId()).toMatch(UUID_V7);
    });

    it("is unique", () => {
        const ids = new Set(Array.from({ length: 1000 }, () => newId()));
        expect(ids.size).toBe(1000);
    });

    it("encodes the timestamp in the first 48 bits", () => {
        const at = 1_700_000_000_000;
        const id = newId(at);
        const timestamp = parseInt(id.replace(/-/g, "").slice(0, 12), 16);
        expect(timestamp).toBe(at);
    });

    it("sorts by creation time", () => {
        const earlier = newId(1_700_000_000_000);
        const later = newId(1_700_000_000_001);
        expect(earlier < later).toBe(true);
    });
});
