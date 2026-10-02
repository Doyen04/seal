import { createApiClient, type ApiClient } from "@repo/core";

/**
 * Browser-side API client that calls the Next.js `/api/proxy` endpoint.
 * Next.js automatically appends session cookies when communicating with `/api/proxy`.
 */
export const client: ApiClient = createApiClient({
    baseUrl: "/api/proxy",
});

export { ApiError } from "@repo/core";
