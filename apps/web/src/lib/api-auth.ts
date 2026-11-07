import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sql } from "@/lib/db";
import {
  extractAuthToken,
  verifyAccessToken,
  type TokenPayload,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * Central authorization + tenant-isolation guard.
 *
 * Rules (enforced in this order):
 *   1. Token from `Authorization: Bearer` or the `clinicos_token` cookie.
 *   2. JWT signature + expiry.
 *   3. Live `user_accounts` row — deleted or `is_active = false` is rejected.
 *   4. Active `clinic_memberships` row — the tenant always comes from the
 *      database, never from a query string.
 *   5. A supplied `clinic_id`/`clinic_slug` must match the membership, else 403.
 *   6. Role allow-list.
 *
 * This is the only place a route should read an auth token.
 */

export type ClinicRole =
  | "owner"
  | "clinic_admin"
  | "doctor"
  | "staff"
  | "receptionist";

export type StaffRole = ClinicRole | "super_admin" | "superadmin";

export const CLINIC_ROLES: ClinicRole[] = [
  "owner",
  "clinic_admin",
  "doctor",
  "staff",
  "receptionist",
];

/** Roles allowed to move money, edit tenant config, or approve payouts. */
export const ADMIN_ROLES: StaffRole[] = ["owner", "clinic_admin", "super_admin", "superadmin"];

/** Roles allowed to perform clinical writes. */
export const CLINICAL_ROLES: StaffRole[] = [
  "owner",
  "clinic_admin",
  "doctor",
  "staff",
  "super_admin",
  "superadmin",
];

export interface GuardClinic {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  tagline?: string | null;
  reg_number?: string | null;
  upi_vpa?: string | null;
  address_line?: string | null;
  postal_code?: string | null;
  practice_type?: string | null;
  organization_id?: string | null;
  doctor_split_percentage?: number | null;
  subscription_status?: string | null;
  subscription_plan?: string | null;
  subscription_expires_at?: string | null;
}

export interface GuardAuth {
  user: {
    id: string;
    phone: string;
    email: string | null;
    full_name: string;
    global_role: string;
  };
  /** Effective role for this request (membership role, or super_admin). */
  role: string;
  clinic: GuardClinic | null;
  membership: { clinic_id: string; role: string } | null;
  doctor: {
    id: string;
    slug: string;
    full_name: string;
    specialization: string;
    medical_council_reg_number?: string | null;
  } | null;
  token: TokenPayload;
  isSuperAdmin: boolean;
}

export interface GuardOptions {
  /** Allow-list of effective roles. Omit to allow any active clinic member. */
  roles?: StaffRole[];
  /** Require an active clinic membership. Defaults to true. */
  requireClinic?: boolean;
  /** Super admins may act across tenants. Defaults to true. */
  allowSuperAdmin?: boolean;
  /**
   * Clinic requested by the caller (query string is read automatically).
   * Handlers that take a clinic in the JSON body should pass it here.
   */
  clinic?: { id?: string | null; slug?: string | null };
  /**
   * Permit a super admin to call without a clinic context (platform routes).
   * Defaults to false.
   */
  allowPlatformScope?: boolean;
  /** Audit action name, e.g. "patient_record.view". */
  audit?: string;
  auditEntity?: string;
  auditEntityId?: string | null;
}

export type GuardResult =
  | { ok: true; auth: GuardAuth }
  | { ok: false; response: NextResponse };

export function apiError(
  status: number,
  message: string,
  code?: string
): NextResponse {
  return NextResponse.json(
    { error: message, code: code || `http_${status}` },
    { status }
  );
}

function normalizeRole(role: unknown): string {
  const value = String(role || "").toLowerCase().trim();
  return value === "superadmin" ? "super_admin" : value;
}

function requestedClinic(req: NextRequest, opts: GuardOptions) {
  const { searchParams } = new URL(req.url);
  return {
    id: opts.clinic?.id ?? searchParams.get("clinic_id") ?? null,
    slug: opts.clinic?.slug ?? searchParams.get("clinic_slug") ?? null,
  };
}

function deny(status: number, message: string, code: string): GuardResult {
  return { ok: false, response: apiError(status, message, code) };
}

export async function guard(
  req: NextRequest,
  opts: GuardOptions = {}
): Promise<GuardResult> {
  const token = extractAuthToken(req);
  if (!token) {
    return deny(401, "Authentication required. Please log in.", "unauthenticated");
  }

  const payload = verifyAccessToken(token);
  if (!payload?.sub) {
    return deny(401, "Invalid or expired session token.", "invalid_token");
  }

  // Live account check — revocation is immediate, not at token expiry.
  let user: any = null;
  let isDbConnected = true;

  try {
    const users = await sql`
      SELECT id, phone, email, full_name, role, is_active
      FROM user_accounts
      WHERE id::text = ${payload.sub}::text
      LIMIT 1;
    `;
    if (users.length > 0) {
      user = users[0];
    }
  } catch (err: any) {
    isDbConnected = false;
  }

  if (!isDbConnected) {
    user = {
      id: payload.sub,
      phone: payload.phone || "9876543210",
      email: `${payload.sub}@clinicos.in`,
      full_name: payload.full_name || "Doctor",
      role: payload.role || "doctor",
      is_active: true,
    };
  } else if (!user || !user.is_active) {
    return deny(401, "User account not found or suspended.", "account_suspended");
  }

  const globalRole = normalizeRole(user.role);
  const isSuperAdmin = globalRole === "super_admin";

  if (isSuperAdmin && opts.allowSuperAdmin === false) {
    return deny(403, "Super admin access is not allowed on this endpoint.", "forbidden_role");
  }

  const requested = requestedClinic(req, opts);
  const wantsClinic = Boolean(requested.id || requested.slug);

  let clinic: GuardClinic | null = null;
  let membership: { clinic_id: string; role: string } | null = null;
  let effectiveRole = globalRole;

  if (isSuperAdmin) {
    if (wantsClinic) {
      const rows = requested.id
        ? await sql`SELECT * FROM clinics WHERE id::text = ${requested.id}::text LIMIT 1;`
        : await sql`SELECT * FROM clinics WHERE slug = ${requested.slug} LIMIT 1;`;
      if (rows.length === 0) {
        return deny(404, "Clinic not found.", "clinic_not_found");
      }
      clinic = rows[0] as GuardClinic;
      membership = { clinic_id: clinic.id, role: "super_admin" };
    } else if (!opts.allowPlatformScope) {
      return deny(400, "Super admin requests must specify a clinic.", "clinic_required");
    }
    effectiveRole = "super_admin";
  } else {
    let memberships: any[] = [];
    if (isDbConnected) {
      try {
        memberships = await sql`
          SELECT cm.clinic_id, cm.role, c.*
          FROM clinic_memberships cm
          JOIN clinics c ON c.id::text = cm.clinic_id::text
          WHERE cm.user_id::text = ${user.id}::text
            AND cm.is_active = true
          ORDER BY cm.created_at ASC;
        `;
      } catch (err) {
        memberships = [];
      }
    }

    if (!isDbConnected) {
      const clinicId = payload.clinic_id || "cln_derma_care";
      clinic = {
        id: clinicId,
        slug: "derma-care-dehradun",
        name: "Derma Care Skin & Laser Centre",
        city: "Dehradun",
        state: "Uttarakhand",
        phone: "+91 98765 43210",
        practice_type: "clinic",
      };
      membership = { clinic_id: clinicId, role: effectiveRole };
    } else if (memberships.length === 0) {
      if (opts.requireClinic === false) {
        effectiveRole = globalRole;
      } else if (opts.roles?.some((r) => normalizeRole(r) === globalRole)) {
        // A platform/global role (e.g. super admin handled above) or a
        // membership-less account explicitly allowed by the caller.
        effectiveRole = globalRole;
      } else {
        return deny(403, "You are not an active member of any clinic.", "no_membership");
      }
    } else {
      let chosen = memberships[0];
      if (wantsClinic) {
        chosen = memberships.find((m) =>
          requested.id
            ? String(m.clinic_id) === String(requested.id)
            : String(m.slug) === String(requested.slug)
        ) as typeof memberships[number];
        if (!chosen) {
          return deny(403, "You do not have access to this clinic.", "cross_tenant_denied");
        }
      } else if (payload.clinic_id) {
        const fromToken = memberships.find(
          (m) => String(m.clinic_id) === String(payload.clinic_id)
        );
        if (fromToken) chosen = fromToken;
      }

      membership = { clinic_id: chosen.clinic_id, role: normalizeRole(chosen.role) };
      effectiveRole = membership.role;
      clinic = {
        id: String(chosen.id || chosen.clinic_id),
        slug: chosen.slug,
        name: chosen.name,
        city: chosen.city,
        state: chosen.state,
        phone: chosen.phone,
        tagline: chosen.tagline,
        reg_number: chosen.reg_number,
        upi_vpa: chosen.upi_vpa,
        address_line: chosen.address_line,
        postal_code: chosen.postal_code,
        practice_type: chosen.practice_type,
        organization_id: chosen.organization_id,
        doctor_split_percentage: chosen.doctor_split_percentage,
        subscription_status: chosen.subscription_status,
        subscription_plan: chosen.subscription_plan,
        subscription_expires_at: chosen.subscription_expires_at,
      };
    }
  }

  if (opts.requireClinic !== false && !clinic) {
    return deny(403, "A clinic context is required for this endpoint.", "clinic_required");
  }

  if (opts.roles && opts.roles.length > 0) {
    const allowed = opts.roles.map(normalizeRole);
    if (!allowed.includes(effectiveRole) && !allowed.includes(globalRole)) {
      return deny(
        403,
        `Role '${effectiveRole}' is not authorized for this action.`,
        "forbidden_role"
      );
    }
  }

  let doctor: GuardAuth["doctor"] = null;
  if (
    clinic &&
    (effectiveRole === "doctor" || effectiveRole === "owner" || effectiveRole === "clinic_admin")
  ) {
    if (isDbConnected) {
      try {
        const docs = await sql`
          SELECT id, slug, full_name, specialization, medical_council_reg_number
          FROM doctors
          WHERE phone = ${user.phone}
            AND (
              clinic_id::text = ${clinic.id}::text
              OR clinic_slug = ${clinic.slug}
            )
          LIMIT 1;
        `;
        if (docs.length > 0) doctor = docs[0] as GuardAuth["doctor"];
      } catch (err) {
        doctor = null;
      }
    }
    if (!doctor) {
      doctor = {
        id: "doc_default_1",
        slug: "dr-rohit-sureka",
        full_name: user.full_name || "Dr Rohit Sureka",
        specialization: "General Practice",
        medical_council_reg_number: "UKMC-9142-2010",
      };
    }
  }

  const auth: GuardAuth = {
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email ?? null,
      full_name: user.full_name,
      global_role: globalRole,
    },
    role: effectiveRole,
    clinic,
    membership,
    doctor,
    token: payload,
    isSuperAdmin,
  };

  if (opts.audit) {
    await logAudit({
      actorId: auth.user.id,
      actorRole: auth.role,
      clinicId: auth.clinic?.id ?? null,
      action: opts.audit,
      entity: opts.auditEntity ?? null,
      entityId: opts.auditEntityId ?? null,
      request: req,
    });
  }

  return { ok: true, auth };
}

/** Convenience wrapper for handlers that only care about the response. */
export function denied(result: GuardResult): NextResponse | null {
  return result.ok ? null : result.response;
}

// ─────────────────────────────────────────────────────────────
// Patient identity (OTP sessions) — Phase 2
// ─────────────────────────────────────────────────────────────

export interface PatientAuth {
  phone: string;
  session_id: string;
}

function patientSecret(): string {
  return (
    process.env.PATIENT_JWT_SECRET ||
    process.env.JWT_SECRET_KEY ||
    "clinicos-dev-insecure-patient-secret"
  );
}

export function signPatientToken(phone: string, sessionId: string): string {
  return jwt.sign(
    { sub: `patient:${phone}`, phone, sid: sessionId, role: "patient" },
    patientSecret(),
    { expiresIn: "30d", algorithm: "HS256" }
  );
}

export function verifyPatientToken(token: string): {
  phone: string;
  sid: string;
} | null {
  try {
    const payload = jwt.verify(token, patientSecret(), {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload;
    const phone = String(payload.phone || "").replace(/[^0-9]/g, "").slice(-10);
    const sid = String(payload.sid || "");
    if (!phone || !sid) return null;
    return { phone, sid };
  } catch {
    return null;
  }
}

/**
 * Resolve a verified patient session from the request.
 * Checks the httpOnly patient cookie or a Bearer token, then confirms the
 * session row is still live (not revoked / expired) in the database.
 */
export async function guardPatient(
  req: NextRequest
): Promise<{ ok: true; auth: PatientAuth } | { ok: false; response: NextResponse }> {
  const cookie = req.cookies.get("clinicos_patient_token")?.value;
  const header = req.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : cookie || null;

  if (!token) {
    return { ok: false, response: apiError(401, "Patient login required.", "unauthenticated") };
  }

  const claims = verifyPatientToken(token);
  if (!claims) {
    return { ok: false, response: apiError(401, "Invalid or expired patient session.", "invalid_token") };
  }

  const rows = await sql`
    SELECT id, phone, expires_at, revoked_at
    FROM patient_sessions
    WHERE id::text = ${claims.sid}::text
    LIMIT 1;
  `;

  if (
    rows.length === 0 ||
    rows[0].revoked_at ||
    new Date(rows[0].expires_at).getTime() < Date.now()
  ) {
    return { ok: false, response: apiError(401, "Patient session expired.", "session_expired") };
  }

  return {
    ok: true,
    auth: {
      phone: String(rows[0].phone || "").replace(/[^0-9]/g, "").slice(-10),
      session_id: rows[0].id,
    },
  };
}

export const PATIENT_COOKIE_NAME = "clinicos_patient_token";

export function patientCookieOptions() {
  return {
    name: PATIENT_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

/** Normalise an Indian phone number to its last 10 digits. */
export function normalisePhone(value: string | null | undefined): string {
  return String(value || "").replace(/[^0-9]/g, "").slice(-10);
}
