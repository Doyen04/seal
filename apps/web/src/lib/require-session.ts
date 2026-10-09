import { createApiClient, SESSION_COOKIE_NAME, type MeResponse } from "@repo/core";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiBaseUrl, webOrigin } from "./server-api";

/**
 * Resolves the signed-in user on the server, or returns null.
 *
 * The workspace, account and onboarding pages are client components that fetch
 * their own data, so without this a signed-out visitor could load the full page
 * shell and only then discover there was no session. This runs before any of
 * that renders. Importing `next/headers` already prevents use in a client
 * component, which is what the `server-only` package would otherwise guarantee.
 */
export async function getServerSession(): Promise<MeResponse | null> {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) return null;

    try {
        const client = createApiClient({
            baseUrl: apiBaseUrl(),
            sessionToken,
            origin: webOrigin(),
        });
        return await client.me();
    } catch {
        // Expired, revoked or malformed. Treat as signed out rather than
        // surfacing an error page.
        return null;
    }
}

/**
 * Server-side guard for routes that require a session. Redirects to the login
 * page, keeping the intended destination so the user lands where they meant to
 * go once signed in.
 */
export async function requireServerSession(returnTo: string): Promise<MeResponse> {
    const session = await getServerSession();
    if (!session) {
        redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    return session;
}