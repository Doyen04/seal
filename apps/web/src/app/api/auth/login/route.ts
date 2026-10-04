import { createApiClient } from "@repo/core";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiBaseUrl, webOrigin } from "@/lib/server-api";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const client = createApiClient({
            baseUrl: apiBaseUrl(),
            origin: webOrigin(),
        });

        const { user, sessionToken } = await client.login(body);

        const cookieStore = await cookies();
        cookieStore.set("seal_session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        return NextResponse.json({ user });
    } catch (error: any) {
        return NextResponse.json(
            {
                error: {
                    code: error.code || "UNAUTHENTICATED",
                    message: error.message || "Login failed",
                    details: error.details,
                },
            },
            { status: error.status || 401 },
        );
    }
}
