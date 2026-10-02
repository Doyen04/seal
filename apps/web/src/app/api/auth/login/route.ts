import { createApiClient } from "@repo/core";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3000/v1";
const WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:3000";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const client = createApiClient({
            baseUrl: API_URL,
            origin: WEB_ORIGIN,
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
