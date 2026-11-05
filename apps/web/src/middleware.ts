import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Edge middleware — defense in depth for pages.
 *
 * The authoritative authorization boundary is `src/lib/api-auth.ts`: every API
 * route re-checks the live database. This middleware exists so an
 * unauthenticated visitor never even renders a staff shell, and so a role
 * mistake in the UI cannot expose another role's screens.
 */

const STAFF_ROLES = new Set([
  "owner",
  "clinic_admin",
  "doctor",
  "staff",
  "receptionist",
  "super_admin",
  "superadmin",
]);

function secretKey(): Uint8Array | null {
  const secret =
    process.env.JWT_SECRET_KEY ||
    process.env.JWT_SECRET ||
    (!process.env.NODE_ENV || process.env.NODE_ENV !== "production"
      ? "clinicos-dev-insecure-secret-key-change-in-prod-2026"
      : "");
  return secret ? new TextEncoder().encode(secret) : null;
}

async function readRole(req: NextRequest): Promise<string | null> {
  const token =
    req.cookies.get("clinicos_token")?.value ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const key = secretKey();
  if (!key) return null;

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return String(payload.role || "").toLowerCase() || null;
  } catch {
    return null;
  }
}

function redirectToLogin(req: NextRequest) {
  const url = new URL("/login", req.url);
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  const res = NextResponse.redirect(url);
  res.cookies.delete("clinicos_token");
  return res;
}

function forbidden(req: NextRequest) {
  return NextResponse.redirect(new URL("/403", req.url));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = await readRole(req);

  if (!role) return redirectToLogin(req);

  if (pathname.startsWith("/superadmin")) {
    if (role !== "super_admin" && role !== "superadmin") return forbidden(req);
    return NextResponse.next();
  }

  if (!STAFF_ROLES.has(role)) return forbidden(req);

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clinic/:path*",
    "/superadmin/:path*",
    "/pharmacy/:path*",
    "/doctor/:path*",
  ],
};
