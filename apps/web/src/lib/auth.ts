import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sql } from "@/lib/db";

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
  address_line?: string;
  city?: string;
  state?: string;
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
 * Robust Server-Side Authorization Pipeline
 * REQUEST -> VERIFY JWT -> GET USER -> GET MEMBERSHIP -> GET CLINIC -> CHECK ROLE -> ALLOW / DENY
 */
export async function authorizeClinicUser(
  req: Request,
  options?: {
    requiredRoles?: string[];
    requiredClinicId?: string | null;
  }
): Promise<AuthorizeResult> {
  const token = extractAuthToken(req);
  if (!token) {
    throw createAuthError("Authentication required. Please log in.", 401);
  }

  const payload = verifyAccessToken(token);
  if (!payload || !payload.sub) {
    throw createAuthError("Invalid or expired session token.", 401);
  }

  try {
    // 1. Fetch user account
    const users = await sql`
      SELECT id, phone, email, full_name, role, is_active 
      FROM user_accounts 
      WHERE id = ${payload.sub}::uuid 
      LIMIT 1;
    `;

    if (users.length === 0 || !users[0].is_active) {
      throw createAuthError("User account not found or suspended.", 401);
    }

    const user = users[0];

    // Super Admin bypass
    if (user.role === "super_admin" || user.role === "superadmin") {
      const authUser: AuthUser = { id: user.id, phone: user.phone, email: user.email, full_name: user.full_name, role: "superadmin" };
      const authMembership: AuthMembership = { clinic_id: options?.requiredClinicId || "derma-care-dehradun", role: "superadmin" };
      const authClinic: AuthClinic = { id: options?.requiredClinicId || "derma-care-dehradun", name: "ClinicOS Master Practice", slug: "derma-care-dehradun" };
      return {
        authorized: true,
        user: authUser,
        membership: authMembership,
        clinic: authClinic,
        doctor: null,
        context: { user: authUser, membership: authMembership, clinic: authClinic, doctor: null },
      };
    }

    // 2. Fetch clinic membership (Tenant Isolation)
    const targetClinicId = options?.requiredClinicId || payload.clinic_id;
    let membershipQuery;

    if (targetClinicId) {
      membershipQuery = await sql`
        SELECT cm.clinic_id, cm.role, c.id as c_id, c.name as clinic_name, c.slug as clinic_slug, c.address_line, c.city, c.state
        FROM clinic_memberships cm
        JOIN clinics c ON c.id = cm.clinic_id
        WHERE cm.user_id = ${user.id} AND cm.clinic_id = ${targetClinicId}::uuid AND cm.is_active = true
        LIMIT 1;
      `;
    } else {
      membershipQuery = await sql`
        SELECT cm.clinic_id, cm.role, c.id as c_id, c.name as clinic_name, c.slug as clinic_slug, c.address_line, c.city, c.state
        FROM clinic_memberships cm
        JOIN clinics c ON c.id = cm.clinic_id
        WHERE cm.user_id = ${user.id} AND cm.is_active = true
        LIMIT 1;
      `;
    }

    if (membershipQuery.length === 0 && options?.requiredRoles && !options.requiredRoles.includes("patient")) {
      throw createAuthError("Forbidden: You are not an active member of this clinic tenant.", 403);
    }

    const membership = membershipQuery[0] || null;
    const activeRole = membership?.role || user.role;

    // 3. Role-Based Access Control check
    if (options?.requiredRoles && options.requiredRoles.length > 0) {
      const allowed = options.requiredRoles.includes(activeRole) || options.requiredRoles.includes(user.role);
      if (!allowed) {
        throw createAuthError(
          `Forbidden: Role '${activeRole}' is not authorized. Required: ${options.requiredRoles.join(", ")}`,
          403
        );
      }
    }

    // 4. Resolve verified doctor profile if applicable
    let doctorProfile: any = null;
    if (activeRole === "doctor" || activeRole === "owner") {
      const docs = await sql`
        SELECT id, slug, full_name, medical_council_reg_number, specialization 
        FROM doctors 
        WHERE (user_id = ${user.id} OR phone = ${user.phone})
        LIMIT 1;
      `;
      if (docs.length > 0) {
        doctorProfile = docs[0];
      }
    }

    const authUser: AuthUser = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      full_name: user.full_name,
      role: activeRole,
    };

    const authMembership: AuthMembership = membership
      ? { clinic_id: membership.clinic_id, role: membership.role }
      : { clinic_id: targetClinicId || "derma-care-dehradun", role: activeRole };

    const authClinic: AuthClinic = membership
      ? {
          id: membership.c_id || membership.clinic_id,
          name: membership.clinic_name || "ClinicOS Practice",
          slug: membership.clinic_slug || "derma-care-dehradun",
          address_line: membership.address_line,
          city: membership.city,
          state: membership.state,
        }
      : {
          id: targetClinicId || "derma-care-dehradun",
          name: "ClinicOS Practice",
          slug: "derma-care-dehradun",
        };

    const authDoctor: AuthDoctor | null = doctorProfile
      ? {
          id: doctorProfile.id,
          slug: doctorProfile.slug,
          full_name: doctorProfile.full_name,
          medical_council_reg_number: doctorProfile.medical_council_reg_number,
          reg_number: doctorProfile.medical_council_reg_number,
          specialization: doctorProfile.specialization,
        }
      : null;

    const context: AuthContext = {
      user: authUser,
      membership: authMembership,
      clinic: authClinic,
      doctor: authDoctor,
    };

    return {
      authorized: true,
      user: authUser,
      membership: authMembership,
      clinic: authClinic,
      doctor: authDoctor,
      context,
    };
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error("Authorization check error:", err);
    throw createAuthError("Internal authorization failure.", 500);
  }
}
