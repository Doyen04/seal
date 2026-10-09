import { NextResponse, type NextRequest } from "next/server";
import { apiBaseUrl, webOrigin } from "@/lib/server-api";
import { SESSION_COOKIE_NAME } from "@repo/core";

/**
 * Blocks the signed-in areas of the app before a page renders.
 *
 * Every workspace, account and onboarding page is a client component that fetches
 * its own data, so without this a signed-out visitor loaded the full dashboard
 * shell and only discovered there was no session once the request failed.
 *
 * A cookie's presence alone is not treated as proof of a session: it is verified
 * against the API, so an expired or tampered cookie is rejected here rather than
 * being passed through to render a page full of error states. The API remains the
 * authority on every individual request.
 */

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
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        return redirectToLogin(request, false);
    }

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

        if (!response.ok) {
            return redirectToLogin(request, true);
        }
    } catch {
        // The API is unreachable. Fail closed rather than rendering a dashboard
        // that cannot load any of its own data.
        return redirectToLogin(request, false);
    }

    return NextResponse.next();
}

export const config = {
    // These must be written inline as literals: the build step parses this
    // export statically and cannot follow a reference to a module-level const.
    matcher: ["/w/:path*", "/account/:path*", "/onboarding"],
};