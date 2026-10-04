import { createApiClient } from "@repo/core";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiBaseUrl, webOrigin } from "@/lib/server-api";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("seal_session")?.value;

        if (sessionToken) {
            const client = createApiClient({
                baseUrl: apiBaseUrl(),
                sessionToken,
                origin: webOrigin(),
            });
            await client.logout().catch(() => {});
        }

        cookieStore.delete("seal_session");

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: { code: "INTERNAL", message: "Logout failed" } }, { status: 500 });
    }
}
