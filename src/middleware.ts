import { NextResponse, type NextRequest } from "next/server";

/**
 * The public site has no user-management system, and /admin/data doesn't
 * warrant building one just for a single operator/developer surface. HTTP
 * Basic Auth, gated by a required env var, is the smallest solution that
 * actually fits this repo's infrastructure (single Docker container behind
 * Caddy TLS termination — credentials never travel unencrypted).
 *
 * Fails CLOSED: if ADMIN_USERNAME/ADMIN_PASSWORD aren't configured, every
 * /admin request is rejected rather than silently left open.
 */
export function middleware(request: NextRequest) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return new NextResponse("Admin-authenticatie is niet geconfigureerd.", { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const suppliedUser = decoded.slice(0, separatorIndex);
    const suppliedPassword = decoded.slice(separatorIndex + 1);

    if (timingSafeEqual(suppliedUser, username) && timingSafeEqual(suppliedPassword, password)) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authenticatie vereist.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Belgische Staatsrekening - admin", charset="UTF-8"' },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export const config = {
  matcher: ["/admin/:path*"],
};
