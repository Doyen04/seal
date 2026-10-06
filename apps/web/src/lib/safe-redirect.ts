/**
 * Constrains a post-login redirect to a path on this origin.
 *
 * `returnTo` arrives from the query string, so an absolute or
 * protocol-relative value would send a freshly authenticated user to another
 * site. Only single-slash paths are accepted; "//evil.example" and
 * "https://evil.example" both fall back to the workspace home.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
    if (!raw) return fallback;
    // Reject anything that could leave the origin: absolute URLs,
    // protocol-relative URLs, and backslash variants browsers normalise.
    if (!raw.startsWith("/")) return fallback;
    if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
    if (raw.includes("\\")) return fallback;
    return raw;
}
