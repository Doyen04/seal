import { createApiClient } from "@repo/core";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3000/v1";
const WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:3000";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("seal_session")?.value;

        if (sessionToken) {
            const client = createApiClient({
                baseUrl: API_URL,
                sessionToken,
                origin: WEB_ORIGIN,
            });
            await client.logout().catch(() => {});
        }

        cookieStore.delete("seal_session");

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: { code: "INTERNAL", message: "Logout failed" } }, { status: 500 });
    }
}
