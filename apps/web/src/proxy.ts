import { NextResponse, type NextRequest } from "next/server";
import { apiBaseUrl, webOrigin } from "@/lib/server-api";
import { SESSION_COOKIE_NAME, type MeResponse } from "@repo/core";

/**
 * Keeps the two halves of the app separate.
 *
 * Signed-in areas are blocked before they render, and the auth pages bounce
 * someone who already has a session back to their workspace. Without the second
 * half a signed-in user can sit on a login form, and the "Back to Seal" link
 * dead-ends into a redirect loop.
 *
 * A cookie's presence is not treated as proof of a session: it is verified
 * against the API, so an expired or tampered cookie is rejected here rather than
 * passed through. The API remains the authority on every individual request.
 */

/** Auth pages that a signed-in visitor should be moved away from. */
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

type SessionResult =
    | { ok: true; session: MeResponse }
    /**
     * `cookieRejected` distinguishes "the API refused this cookie, delete it"
     * from "the API could not be reached, the cookie may be perfectly fine".
     */
    | { ok: false; cookieRejected: boolean };

/** The session for a cookie value. */
async function fetchSession(token: string): Promise<SessionResult> {
    try {
        const response = await fetch(`${apiBaseUrl()}/me`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Cookie: `${SESSION_COOKIE_NAME}=${token}`,
                Origin: webOrigin(),
            },
            // Never serve a cached "yes you are signed in" answer.
            cache: "no-store",
        });
        if (!response.ok) return { ok: false, cookieRejected: true };
        return { ok: true, session: (await response.json()) as MeResponse };
    } catch {
        return { ok: false, cookieRejected: false };
    }
}

/** Where a signed-in user belongs. */
function dashboardPath(session: MeResponse): string {
    const first = session.workspaces?.[0];
    return first ? `/w/${first.slug}` : "/onboarding";
}

function redirectToLogin(request: NextRequest, clearCookie: boolean): NextResponse {
    const { pathname, search } = request.nextUrl;
    const loginUrl = new URL("/login", request.url);
    // Keep where they were heading so login can send them back.
    loginUrl.searchParams.set("returnTo", `${pathname}${search}`);

    const response = NextResponse.redirect(loginUrl);
    if (clearCookie) {
        // A cookie that failed verification would otherwise be sent again on
        // every subsequent request and fail again.
        response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    const isAuthPage = AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));

    if (isAuthPage) {
        // No cookie, nothing to do. The form is exactly what they came for.
        if (!token) return NextResponse.next();

        const result = await fetchSession(token);
        if (!result.ok) {
            const response = NextResponse.next();
            // Only discard a cookie the API actually refused. If the API was
            // merely unreachable, the cookie may still be valid.
            if (result.cookieRejected) response.cookies.delete(SESSION_COOKIE_NAME);
            return response;
        }
        return NextResponse.redirect(new URL(dashboardPath(result.session), request.url));
    }

    // Everything below is a signed-in area.
    if (!token) return redirectToLogin(request, false);

    const result = await fetchSession(token);
    // Fails closed either way: an unreachable API must not render a dashboard
    // that cannot load any of its own data.
    if (!result.ok) return redirectToLogin(request, result.cookieRejected);

    return NextResponse.next();
}

/**
 * Matcher values must be written inline as literals: the build step parses this
 * export statically and cannot follow a reference to a module-level const.
 */
export const config = {
    matcher: [
        "/w/:path*",
        "/account/:path*",
        "/onboarding",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
    ],
};
