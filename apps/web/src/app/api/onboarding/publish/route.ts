import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { apiError, guardPatient, normalisePhone } from "@/lib/api-auth";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";
import { passwordPolicyError } from "@/lib/password";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Doctor & clinic onboarding — request stage.
 *
 * Security model:
 *   - The submitter must prove control of the phone number with a patient OTP
 *     session. The phone in the body must match that session.
 *   - An existing account is NEVER modified or re-roled. It returns 409 and the
 *     owner must sign in and add a clinic from inside the product.
 *   - A real password is required; there is no default password.
 *   - The clinic and doctor are created in `pending` state with no membership
 *     and no session token. A super admin approves the clinic before it becomes
 *     bookable or visible in the public directory.
 */
export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit(rateLimitKey(req, "onboarding:publish"), 10, 3600);
    if (!limit.allowed) {
      return NextResponse.json(tooManyRequests(limit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const body = await req.json().catch(() => ({}));

    // 1. Prove the phone number. Publishing without a verified patient session
    //    is the account-takeover vector this endpoint used to expose.
    const phone = normalisePhone(body.phone);
    if (phone.length !== 10) {
      return apiError(400, "A valid 10-digit mobile number is required.", "invalid_phone");
    }

    const session = await guardPatient(req);
    if (!session.ok) {
      return apiError(
        401,
        "Verify your mobile number with a one-time code before publishing.",
        "phone_verification_required"
      );
    }
    if (session.auth.phone !== phone) {
      return apiError(
        403,
        "The verified phone number does not match the submitted number.",
        "phone_mismatch"
      );
    }

    let { doctor, clinic, ai_bio, practice_type } = body;

    const practiceType: "solo" | "clinic" = practice_type === "clinic" ? "clinic" : "solo";
    const planType = practiceType === "clinic" ? "multi_clinic" : "solo_practice";
    const planPrice = practiceType === "clinic" ? 1299.0 : 599.0;
    const maxDoctors = practiceType === "clinic" ? 10 : 1;

    // Support flat payload as well as nested payload
    if (!doctor) {
      doctor = {
        full_name: body.doctor_name || body.full_name || "",
        specialization: body.specialization || "General Medicine",
        qualifications: body.qualifications || "MBBS, MD",
        medical_council_reg_number: body.medical_council_reg_number || null,
        medical_council_state: body.medical_council_state || "State Medical Council",
        years_of_experience: Number(body.years_of_experience) || 10,
        consultation_fee: Number(body.consultation_fee) || 500,
        followup_fee: Number(body.followup_fee) || 200,
        services: Array.isArray(body.services) ? body.services : ["General Consultation"],
      };
    }

    if (!clinic) {
      clinic = {
        name: body.clinic_name || "",
        address_line: body.address_line || "Main Road",
        city: body.city || "Dehradun",
        state: body.state || "Uttarakhand",
        postal_code: body.postal_code || "248001",
        opening_hours: body.opening_hours || {
          morning: "10:00 AM - 02:00 PM",
          evening: "05:00 PM - 08:30 PM",
        },
      };
    }

    const doctorName = String(doctor.full_name || "").trim();
    const clinicName = String(clinic.name || "").trim();
    if (!doctorName) {
      return apiError(400, "Doctor name is required.", "missing_doctor_name");
    }
    if (!clinicName) {
      return apiError(400, "Clinic name is required.", "missing_clinic_name");
    }

    // 2. Enforce a real password. No default, no server-generated credential.
    const passwordError = passwordPolicyError(body.password, {
      phone,
      name: doctorName,
    });
    if (passwordError) {
      return apiError(400, passwordError, "weak_password");
    }

    const storedPhone = `+91${phone}`;

    // 3. Never touch an existing account. Re-rolling a user to `owner` from a
    //    public endpoint is a privilege-escalation bug, not a feature.
    const existingUser = await sql`
      SELECT id FROM user_accounts
      WHERE right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = ${phone}
      LIMIT 1
    `;
    if (existingUser.length > 0) {
      return apiError(
        409,
        "An account already exists for this phone number. Sign in and add the clinic from your dashboard.",
        "account_exists"
      );
    }

    // 4. Generate unique slugs.
    let docSlug = doctorName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!docSlug.startsWith("dr-")) {
      docSlug = `dr-${docSlug}`;
    }
    const existingDoc = await sql`SELECT id FROM doctors WHERE slug = ${docSlug} LIMIT 1`;
    if (existingDoc.length > 0) {
      docSlug = `${docSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    let clinicSlug = clinicName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const existingClinic = await sql`SELECT id FROM clinics WHERE slug = ${clinicSlug} LIMIT 1`;
    if (existingClinic.length > 0) {
      clinicSlug = `${clinicSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const orgId = crypto.randomUUID();
    const clinicId = crypto.randomUUID();
    const doctorId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const orgSlug = `${clinicSlug}-org`;

    const passwordHash = await hashPassword(String(body.password));

    // 5. Provision the pending identity. Phone is proven, so `is_verified` is
    //    true for the account, but the tenant itself still needs approval.
    try {
      await sql`
        INSERT INTO user_accounts (
          id, phone, email, password_hash, full_name, role, is_verified, is_active, created_at
        ) VALUES (
          ${userId}, ${storedPhone}, NULL, ${passwordHash}, ${doctorName},
          'owner', true, true, NOW()
        )
      `;
    } catch (insertErr: any) {
      if (insertErr?.code === "23505") {
        return apiError(
          409,
          "An account already exists for this phone number. Sign in and add the clinic from your dashboard.",
          "account_exists"
        );
      }
      throw insertErr;
    }

    const facilities = [
      "Full AC",
      "Waiting Lounge",
      "WiFi",
      "Wheelchair Accessible",
      "Digital Prescriptions",
    ];
    const openingHours = clinic.opening_hours || {
      "Monday - Saturday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM",
      Sunday: "Closed",
    };

    await sql`
      INSERT INTO organizations (
        id, owner_user_id, name, slug, practice_type, plan_type, plan_price_inr,
        max_doctors, subscription_status, created_at
      ) VALUES (
        ${orgId}, ${userId}, ${`${clinicName} Organization`}, ${orgSlug},
        ${practiceType}, ${planType}, ${planPrice}, ${maxDoctors}, 'pending', NOW()
      )
      ON CONFLICT (slug) DO UPDATE
      SET practice_type = ${practiceType}, plan_type = ${planType},
          plan_price_inr = ${planPrice}, max_doctors = ${maxDoctors},
          subscription_status = 'pending';
    `;

    await sql`
      INSERT INTO clinics (
        id, organization_id, slug, name, practice_type, phone, address_line, city, state,
        postal_code, facilities, opening_hours, status, is_verified,
        subscription_status, subscription_plan, created_at
      ) VALUES (
        ${clinicId}, ${orgId}, ${clinicSlug}, ${clinicName}, ${practiceType}, ${storedPhone},
        ${clinic.address_line || "Main Road"}, ${clinic.city || "Dehradun"},
        ${clinic.state || "Uttarakhand"}, ${clinic.postal_code || "248001"},
        ${JSON.stringify(facilities)}, ${JSON.stringify(openingHours)},
        'pending', false, 'pending', ${planType}, NOW()
      )
    `;

    const consultationFee = Number(doctor.consultation_fee) || 500;
    const followupFee = Number(doctor.followup_fee) || Math.round(consultationFee * 0.4);
    const services = Array.isArray(doctor.services) ? doctor.services : ["General Consultation"];

    await sql`
      INSERT INTO doctors (
        id, slug, title, full_name, specialization, qualification_summary,
        medical_council_reg_number, medical_council_state, years_of_experience,
        consultation_fee, followup_fee, followup_validity_days, services_offered,
        verification_status, rating, total_reviews,
        clinic_id, clinic_name, clinic_slug, clinic_address,
        opd_timings, phone, bio, user_id, is_active, created_at
      ) VALUES (
        ${doctorId}, ${docSlug}, 'Dr.', ${doctorName},
        ${doctor.specialization || "General Medicine"},
        ${doctor.qualifications || "MBBS, MD"},
        ${doctor.medical_council_reg_number || null},
        ${doctor.medical_council_state || "Uttarakhand Medical Council"},
        ${Number(doctor.years_of_experience) || 5},
        ${consultationFee}, ${followupFee}, 7,
        ${JSON.stringify(services)}, 'pending', 0, 0,
        ${clinicId}, ${clinicName}, ${clinicSlug},
        ${clinic.address_line || "Main Road, Dehradun"},
        'Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM',
        ${storedPhone}, ${ai_bio || `${doctorName} is a specialist in ${clinic.city || "Dehradun"}.`},
        ${userId}, false, NOW()
      )
    `;

    // 6. Deliberately NO clinic_memberships row and NO access token. The owner
    //    gains a working session only after approval creates the membership.
    return NextResponse.json(
      {
        status: "pending_verification",
        doctor_id: doctorId,
        doctor_slug: docSlug,
        clinic_id: clinicId,
        clinic_slug: clinicSlug,
        practice_type: practiceType,
        plan_type: planType,
        plan_price_inr: planPrice,
        max_doctors: maxDoctors,
        message:
          "Your clinic has been submitted for verification. You will be able to sign in after a platform administrator approves it.",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    console.error("Onboarding publish error:", error);
    return apiError(500, "Failed to submit your clinic for verification.", "internal_error");
  }
}
