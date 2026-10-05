import { describe, expect, it } from "vitest";
import app from "./index.js";

/**
 * Vercel's Hono preset bundles whichever of `src/app.*`, `src/index.*` or
 * `src/server.*` it finds first and fails the deployment with
 * "The default export must be a function or server" if the shape is wrong.
 *
 * A sibling `src/app.ts` once shadowed this file and broke production while
 * every local check still passed, so the entrypoint contract is asserted here
 * and the candidate filenames are checked explicitly.
 */
describe("vercel entrypoint", () => {
    it("default-exports an object with a fetch handler", () => {
        expect(app).toBeDefined();
        expect(typeof (app as { fetch?: unknown }).fetch).toBe("function");
    });

    it("has no shadowing app/server entrypoint beside index.ts", async () => {
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const { fileURLToPath } = await import("node:url");
        const src = path.dirname(fileURLToPath(import.meta.url));
        const entries = await fs.readdir(src);

        // Only `index.*` may exist; Vercel prefers `app.*` over `index.*`.
        expect(entries.filter((f) => /^(app|server)\.[cm]?[jt]sx?$/.test(f))).toEqual([]);
        expect(entries.filter((f) => /^index\.[cm]?[jt]sx?$/.test(f))).toHaveLength(1);
    });
});
