/**
 * Server-side only. Browser code must use `@/lib/api-client`, which talks to
 * the `/api/proxy` route on this app instead.
 *
 * `API_URL` is injected by the `api` service binding declared in the root
 * `vercel.json`, so it is the internal base URL of the API service and is only
 * available at request time, never during a build. Bindings do not resolve in
 * `next build`, so nothing here may run at module scope.
 */

/** Base URL of the API service, without a trailing slash. */
export function apiServiceUrl(): string {
    return (process.env.API_URL ?? "http://localhost:3001").replace(/\/+$/, "");
}

/**
 * Base URL of the API including `/v1`, which is the Hono app's `basePath`.
 * Public requests arrive at `/api/v1/...`; internal calls go straight to
 * `/v1/...`, so both resolve to the same routes.
 */
export function apiBaseUrl(): string {
    return `${apiServiceUrl()}/v1`;
}

/**
 * This app's own origin, sent to the API as the `Origin` header on
 * session-cookie writes. Must match `WEB_ORIGIN` in the API's settings.
 */
export function webOrigin(): string {
    return process.env.WEB_ORIGIN ?? "http://localhost:3000";
}
