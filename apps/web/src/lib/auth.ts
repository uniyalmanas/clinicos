import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
      throw new Error("FATAL: JWT_SECRET_KEY environment variable is missing in production!");
    }
    return "clinicos-dev-insecure-secret-key-change-in-prod-2026";
  }
  return secret;
}

export const AUTH_COOKIE_OPTIONS = {
  name: "clinicos_token",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export interface TokenPayload {
  sub: string;
  role: string;
  clinic_id?: string | null;
  phone?: string;
  full_name?: string;
  exp?: number;
}

export interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  full_name: string;
  role: string;
}

export interface AuthClinic {
  id: string;
  name: string;
  slug: string;
  organization_id?: string | null;
  practice_type?: "solo" | "clinic";
  plan_type?: string;
  max_doctors?: number;
  address_line?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  postal_code?: string | null;
  upi_vpa?: string | null;
  tagline?: string | null;
  reg_number?: string | null;
  doctor_split_percentage?: number | null;
  subscription_status?: string | null;
  subscription_plan?: string | null;
  subscription_expires_at?: string | null;
}

export interface AuthMembership {
  clinic_id: string;
  role: string;
}

export interface AuthDoctor {
  id: string;
  slug: string;
  full_name: string;
  medical_council_reg_number: string;
  specialization: string;
  reg_number?: string;
}

export interface AuthContext {
  user: AuthUser;
  membership: AuthMembership | null;
  clinic: AuthClinic | null;
  doctor: AuthDoctor | null;
}

export interface AuthorizeResult {
  authorized: boolean;
  user: AuthUser;
  membership: AuthMembership;
  clinic: AuthClinic;
  doctor: AuthDoctor | null;
  context: AuthContext;
  error?: string;
  status?: number;
}

function createAuthError(message: string, status: number = 401): Error & { status: number } {
  const err: any = new Error(message);
  err.status = status;
  return err;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

export function signAccessToken(payload: {
  sub: string;
  role: string;
  clinic_id?: string | null;
  phone?: string;
  full_name?: string;
}): string {
  return jwt.sign(
    {
      sub: payload.sub,
      role: payload.role,
      clinic_id: payload.clinic_id || null,
      phone: payload.phone,
      full_name: payload.full_name,
    },
    getJwtSecret(),
    {
      expiresIn: "7d",
      algorithm: "HS256",
    }
  );
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/clinicos_token=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Super-admin authorization for platform-level endpoints.
 * Verifies the JWT *and* re-checks the live account role so that a demoted or
 * suspended super-admin loses access immediately instead of when the token expires.
 */
export async function authorizeSuperAdmin(req: Request): Promise<TokenPayload> {
  const { guard } = await import("@/lib/api-auth");
  const result = await guard(req as any, {
    roles: ["super_admin"],
    requireClinic: false,
    allowPlatformScope: true,
  });
  if (!result.ok) {
    throw createAuthError("Super admin access required.", result.response.status);
  }
  return result.auth.token;
}

/**
 * Compatibility wrapper over the central guard.
 * Existing routes keep working while every authorization decision flows
 * through one place (tenant from the database, live role checks).
 */
export async function authorizeClinicUser(
  req: Request,
  options?: {
    requiredRoles?: string[];
    requiredClinicId?: string | null;
  }
): Promise<AuthorizeResult> {
  const { guard } = await import("@/lib/api-auth");
  const result = await guard(req as any, {
    roles: options?.requiredRoles as any,
    clinic: options?.requiredClinicId ? { id: options.requiredClinicId } : undefined,
    requireClinic: true,
  });

  if (!result.ok) {
    const status = result.response.status;
    let message = "Forbidden.";
    try {
      const body = await result.response.clone().json();
      message = body?.error || message;
    } catch {
      /* ignore */
    }
    throw createAuthError(message, status);
  }

  const { auth } = result;
  const membership = auth.membership ?? {
    clinic_id: auth.clinic?.id || "",
    role: auth.role,
  };
  const clinic: AuthClinic = auth.clinic
    ? {
        id: auth.clinic.id,
        name: auth.clinic.name,
        slug: auth.clinic.slug,
        city: auth.clinic.city ?? null,
        state: auth.clinic.state ?? null,
        phone: auth.clinic.phone ?? null,
        address_line: auth.clinic.address_line ?? null,
        postal_code: auth.clinic.postal_code ?? null,
        upi_vpa: auth.clinic.upi_vpa ?? null,
        tagline: auth.clinic.tagline ?? null,
        reg_number: auth.clinic.reg_number ?? null,
        organization_id: auth.clinic.organization_id ?? null,
        doctor_split_percentage: auth.clinic.doctor_split_percentage ?? null,
        subscription_status: auth.clinic.subscription_status ?? null,
        subscription_plan: auth.clinic.subscription_plan ?? null,
        subscription_expires_at: auth.clinic.subscription_expires_at ?? null,
        practice_type:
          auth.clinic.practice_type === "clinic" || auth.clinic.practice_type === "solo"
            ? auth.clinic.practice_type
            : undefined,
      }
    : {
        id: membership.clinic_id,
        name: "ClinicOS Practice",
        slug: "",
        practice_type: "solo" as const,
        plan_type: "solo_practice",
        max_doctors: 1,
      };

  return {
    authorized: true,
    user: {
      id: auth.user.id,
      phone: auth.user.phone,
      email: auth.user.email ?? undefined,
      full_name: auth.user.full_name,
      role: auth.role,
    },
    membership,
    clinic,
    doctor: auth.doctor
      ? {
          id: auth.doctor.id,
          slug: auth.doctor.slug,
          full_name: auth.doctor.full_name,
          medical_council_reg_number: auth.doctor.medical_council_reg_number || "",
          specialization: auth.doctor.specialization,
          reg_number: auth.doctor.medical_council_reg_number || "",
        }
      : null,
    context: {
      user: {
        id: auth.user.id,
        phone: auth.user.phone,
        email: auth.user.email ?? undefined,
        full_name: auth.user.full_name,
        role: auth.role,
      },
      membership,
      clinic,
      doctor: auth.doctor
        ? {
            id: auth.doctor.id,
            slug: auth.doctor.slug,
            full_name: auth.doctor.full_name,
            medical_council_reg_number: auth.doctor.medical_council_reg_number || "",
            specialization: auth.doctor.specialization,
            reg_number: auth.doctor.medical_council_reg_number || "",
          }
        : null,
    },
  };
}
