import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, signAccessToken } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { phone, doctor, clinic, ai_bio, practice_type } = body;

    const practiceType: "solo" | "clinic" = practice_type === "clinic" ? "clinic" : "solo";
    const planType = practiceType === "clinic" ? "multi_clinic" : "solo_practice";
    const planPrice = practiceType === "clinic" ? 1299.00 : 599.00;
    const maxDoctors = practiceType === "clinic" ? 10 : 1;

    // Support flat payload as well as nested payload
    if (!doctor) {
      doctor = {
        full_name: body.full_name || body.doctor_name,
        specialization: body.specialization || body.specialty || "General Physician",
        qualifications: body.qualifications || body.qualification || "MBBS",
        medical_council_reg_number: body.council_registration_number || body.medical_council_reg_number || body.reg_number || "UKMC-REG-2024",
        medical_council_state: body.medical_council_state || "Uttarakhand Medical Council",
        years_of_experience: Number(body.years_of_experience || 5),
        consultation_fee: Number(body.consultation_fee || 500),
        services: body.services || ["General Consultation"]
      };
    }
    if (!clinic) {
      clinic = {
        name: body.clinic_name || body.name,
        address_line: body.clinic_address || body.address_line || "Dehradun Medical Enclave",
        city: body.city || "Dehradun",
        state: body.state || "Uttarakhand",
        postal_code: body.postal_code || "248001",
        opening_hours: body.opening_hours
      };
    }

    if (!doctor?.full_name || !clinic?.name) {
      return NextResponse.json(
        { detail: "Doctor name and clinic name are required to publish." },
        { status: 400 }
      );
    }

    const cleanPhone = (phone || "+919876543299").trim();

    // 1. Create or link user account first (Account Root)
    let userId: string;
    const existingUser = await sql`SELECT id FROM user_accounts WHERE phone = ${cleanPhone} LIMIT 1`;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      await sql`
        UPDATE user_accounts
        SET role = 'owner', is_verified = true
        WHERE id = ${userId}
      `;
    } else {
      userId = crypto.randomUUID();
      const defaultPasswordHash = await hashPassword("Password@123");
      await sql`
        INSERT INTO user_accounts (
          id, phone, email, password_hash, full_name, role, is_verified, is_active, created_at
        ) VALUES (
          ${userId}, ${cleanPhone}, ${cleanPhone + "@clinicos.in"},
          ${defaultPasswordHash}, ${doctor.full_name.trim()},
          'owner', true, true, NOW()
        )
      `;
    }

    // 2. Generate Slugs
    let docSlug = doctor.full_name
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

    let clinicSlug = clinic.name
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
    const orgSlug = `${clinicSlug}-org`;

    // 3. Insert Organization (Organization Root with Plan Tier Guardrails)
    try {
      await sql`
        INSERT INTO organizations (
          id, owner_user_id, name, slug, practice_type, plan_type, plan_price_inr, max_doctors, subscription_status, created_at
        ) VALUES (
          ${orgId}, ${userId}, ${`${clinic.name.trim()} Organization`}, ${orgSlug},
          ${practiceType}, ${planType}, ${planPrice}, ${maxDoctors}, 'active', NOW()
        )
        ON CONFLICT (slug) DO UPDATE
        SET practice_type = ${practiceType}, plan_type = ${planType}, plan_price_inr = ${planPrice}, max_doctors = ${maxDoctors};
      `;
    } catch (orgErr) {
      console.warn("Organizations table insert skipped or fallback:", orgErr);
    }

    // 4. Insert Clinic
    const facilities = ["Full AC", "Waiting Lounge", "WiFi", "Wheelchair Accessible", "Digital Prescriptions"];
    const openingHours = clinic.opening_hours || {
      "Monday - Saturday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM",
      Sunday: "Closed",
    };

    await sql`
      INSERT INTO clinics (
        id, organization_id, slug, name, practice_type, phone, address_line, city, state, postal_code,
        facilities, opening_hours, status,
        subscription_status, subscription_plan, created_at
      ) VALUES (
        ${clinicId}, ${orgId}, ${clinicSlug}, ${clinic.name.trim()}, ${practiceType}, ${cleanPhone},
        ${clinic.address_line || "Rajpur Road"}, ${clinic.city || "Dehradun"},
        ${clinic.state || "Uttarakhand"}, ${clinic.postal_code || "248001"},
        ${JSON.stringify(facilities)}, ${JSON.stringify(openingHours)},
        'active', 'active', ${planType}, NOW()
      )
    `;

    // 5. Insert Doctor
    const consultationFee = Number(doctor.consultation_fee) || 500;
    const followupFee = Number(doctor.followup_fee) || Math.round(consultationFee * 0.4);
    const services = Array.isArray(doctor.services) ? doctor.services : ["General Consultation"];

    await sql`
      INSERT INTO doctors (
        id, slug, full_name, title, specialization, qualification_summary,
        medical_council_reg_number, medical_council_state, years_of_experience,
        consultation_fee, followup_fee, followup_validity_days, services_offered,
        verification_status, rating, total_reviews,
        clinic_id, user_id, clinic_name, clinic_slug, clinic_address,
        opd_timings, phone, bio, created_at
      ) VALUES (
        ${doctorId}, ${docSlug}, ${doctor.full_name.trim()}, 'Dr.',
        ${doctor.specialization || "General Physician"},
        ${doctor.qualifications || "MBBS"},
        ${doctor.medical_council_reg_number || "UKMC-VERIFIED-2026"},
        ${doctor.medical_council_state || "Uttarakhand Medical Council"},
        ${Number(doctor.years_of_experience) || 5},
        ${consultationFee}, ${followupFee}, 7,
        ${JSON.stringify(services)}, 'verified', 5.0, 1,
        ${clinicId}, ${userId}, ${clinic.name.trim()}, ${clinicSlug},
        ${clinic.address_line || "Rajpur Road, Dehradun"},
        'Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM',
        ${cleanPhone}, ${ai_bio || doctor.full_name + " is a specialist in Dehradun."},
        NOW()
      )
    `;

    // 6. Create clinic membership (Role: owner / doctor)
    const membershipId = crypto.randomUUID();
    await sql`
      INSERT INTO clinic_memberships (
        id, user_id, clinic_id, role, is_active, created_at
      ) VALUES (
        ${membershipId}, ${userId}, ${clinicId}, 'owner', true, NOW()
      )
    `;

    // 7. Sign token for instant session
    const accessToken = signAccessToken({
      sub: userId,
      role: "owner",
      clinic_id: clinicId,
      phone: cleanPhone,
      full_name: doctor.full_name.trim(),
    });

    const response = NextResponse.json({
      status: "published",
      doctor_id: doctorId,
      doctor_slug: docSlug,
      clinic_id: clinicId,
      clinic_slug: clinicSlug,
      practice_type: practiceType,
      plan_type: planType,
      plan_price_inr: planPrice,
      max_doctors: maxDoctors,
      doctor_url: `/doctors/${docSlug}`,
      clinic_url: `/clinics/${clinicSlug}`,
      access_token: accessToken,
      message: `Congratulations ${doctor.full_name}! Your ${practiceType === 'solo' ? 'Solo Practice Pro' : 'Polyclinic'} workspace is now officially active.`,
    });

    // Set cookie
    response.cookies.set({
      name: "clinicos_token",
      value: accessToken,
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Onboarding publish error:", error);
    return NextResponse.json(
      { detail: error.message || "Failed to publish clinic and doctor profile." },
      { status: 500 }
    );
  }
}
