import { NextRequest, NextResponse } from "next/server";

// Only /api/v1/* needs CORS — /admin/* is server-rendered, cookie-authenticated,
// and always same-origin (the admin panel is served by this same Next.js app),
// so it never goes through a cross-origin fetch that CORS would gate.
// /api/v1/* is different: it's called from the Flutter app, which on native
// Android/iOS isn't subject to CORS at all (that's a browser-only mechanism),
// but IS subject to it when running as Flutter web (see .claude/launch.json's
// "sahl-mobile-web" target) or from any other browser-based client — without
// this, the browser silently drops the response even though the server
// processed the request correctly, which looks like a network failure with
// no server-side error to debug.
//
// ALLOWED_ORIGINS is the same env var the realtime Socket.IO server already
// reads (src/realtime/server.ts) — one origin allowlist, not two.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !allowedOrigins.includes(origin)) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: "/api/v1/:path*",
};
