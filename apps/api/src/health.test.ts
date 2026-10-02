import { describe, expect, it } from "vitest";
import app from "./index.js";

describe("GET /v1/health", () => {
    it("returns ok without auth", async () => {
        const res = await app.request("/v1/health");
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
    });
});
