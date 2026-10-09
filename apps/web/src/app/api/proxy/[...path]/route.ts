import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiBaseUrl, webOrigin } from "@/lib/server-api";

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    const targetPath = "/" + path.join("/");

    const url = new URL(request.url);
    const targetUrl = new URL(apiBaseUrl() + targetPath);
    url.searchParams.forEach((val, key) => {
        targetUrl.searchParams.set(key, val);
    });

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("seal_session")?.value;

    const headers: Record<string, string> = {
        Accept: "application/json",
        Origin: webOrigin(),
    };

    const contentType = request.headers.get("content-type");
    if (contentType) {
        headers["Content-Type"] = contentType;
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader) {
        headers["Authorization"] = authHeader;
    } else if (sessionToken) {
        headers["Cookie"] = `seal_session=${sessionToken}`;
    }

    // Without this the API only ever sees this Next.js server's address, so
    // every audit entry recorded `::1` locally and the internal hop address on
    // Vercel, making the audit IP column useless. The platform sets this header
    // on the request that reaches us, so pass it straight through and let the
    // API's getClientIp pick the first entry.
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        headers["X-Forwarded-For"] = forwardedFor;
    }

    let body: string | undefined = undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
        body = await request.text();
    }

    try {
        const apiRes = await fetch(targetUrl.toString(), {
            method: request.method,
            headers,
            body,
            cache: "no-store",
        });

        const resData = await apiRes.json().catch(() => ({}));
        return NextResponse.json(resData, { status: apiRes.status });
    } catch (error: any) {
        return NextResponse.json({ error: { code: "INTERNAL", message: "Failed to connect to API" } }, { status: 502 });
    }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
