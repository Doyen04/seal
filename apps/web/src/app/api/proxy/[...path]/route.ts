import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3000/v1";
const WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:3000";

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const targetPath = "/" + path.join("/");

  const url = new URL(request.url);
  const targetUrl = new URL(API_URL + targetPath);
  url.searchParams.forEach((val, key) => {
    targetUrl.searchParams.set(key, val);
  });

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("seal_session")?.value;

  const headers: Record<string, string> = {
    Accept: "application/json",
    Origin: WEB_ORIGIN,
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
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to connect to API" } },
      { status: 502 }
    );
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
