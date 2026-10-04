import { afterEach, describe, expect, it } from "vitest";
import { ApiError, createApiClient } from "./client.js";

/** Records the URL the client tried to fetch. */
function stubFetch(): { calls: string[]; fetch: typeof fetch } {
    const calls: string[] = [];
    const stub = (async (input: unknown) => {
        calls.push(String(input));
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }) as unknown as typeof fetch;
    return { calls, fetch: stub };
}

function stubLocation(origin: string): void {
    (globalThis as { location?: unknown }).location = { origin };
}

afterEach(() => {
    delete (globalThis as { location?: unknown }).location;
});

describe("createApiClient url resolution", () => {
    it("resolves an absolute baseUrl", async () => {
        const { calls, fetch } = stubFetch();
        const client = createApiClient({ baseUrl: "https://api.example.com/v1/", fetch });

        await client.signup({ name: "A", email: "a@example.com", password: "correct horse battery" });

        expect(calls).toEqual(["https://api.example.com/v1/auth/signup"]);
    });

    it("resolves a relative baseUrl against the current origin", async () => {
        stubLocation("https://seal.example.com");
        const { calls, fetch } = stubFetch();
        const client = createApiClient({ baseUrl: "/api/proxy", fetch });

        await client.signup({ name: "A", email: "a@example.com", password: "correct horse battery" });

        expect(calls).toEqual(["https://seal.example.com/api/proxy/auth/signup"]);
    });

    it("appends query parameters to a relative baseUrl", async () => {
        stubLocation("https://seal.example.com");
        const { calls, fetch } = stubFetch();
        const client = createApiClient({ baseUrl: "/api/proxy", fetch });

        await client.audit("2f1c9a4e-0000-4000-8000-000000000000", { limit: 50 });

        expect(calls).toEqual([
            "https://seal.example.com/api/proxy/workspaces/2f1c9a4e-0000-4000-8000-000000000000/audit?limit=50",
        ]);
    });

    it("rejects a relative baseUrl outside a browser", async () => {
        const { fetch } = stubFetch();
        const client = createApiClient({ baseUrl: "/api/proxy", fetch });

        await expect(
            client.signup({ name: "A", email: "a@example.com", password: "correct horse battery" }),
        ).rejects.toThrowError(ApiError);
    });
});
