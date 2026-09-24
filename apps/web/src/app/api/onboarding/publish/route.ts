import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, signAccessToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { phone, doctor, clinic, ai_bio } = body;

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

    // Generate unique doctor slug
    let docSlug = doctor.full_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!docSlug.startsWith("dr-")) {
      docSlug = `dr-${docSlug}`;
    }

    // Check slug collision
    const existingDoc = await sql`SELECT id FROM doctors WHERE slug = ${docSlug} LIMIT 1`;
    if (existingDoc.length > 0) {
      docSlug = `${docSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Generate unique clinic slug
    let clinicSlug = clinic.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const existingClinic = await sql`SELECT id FROM clinics WHERE slug = ${clinicSlug} LIMIT 1`;
    if (existingClinic.length > 0) {
      clinicSlug = `${clinicSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const clinicId = crypto.randomUUID();
    const doctorId = crypto.randomUUID();

    const facilities = ["Full AC", "Waiting Lounge", "WiFi", "Wheelchair Accessible", "Digital Prescriptions"];
    const openingHours = clinic.opening_hours || {
      "Monday - Saturday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM",
      Sunday: "Closed",
    };

    // 1. Insert Clinic
    await sql`
      INSERT INTO clinics (
        id, slug, name, phone, address_line, city, state, postal_code,
        facilities, opening_hours, status,
        subscription_status, subscription_plan, created_at
      ) VALUES (
        ${clinicId}, ${clinicSlug}, ${clinic.name.trim()}, ${cleanPhone},
        ${clinic.address_line || "Rajpur Road"}, ${clinic.city || "Dehradun"},
        ${clinic.state || "Uttarakhand"}, ${clinic.postal_code || "248001"},
        ${JSON.stringify(facilities)}, ${JSON.stringify(openingHours)},
        'active', 'trial', 'starter', NOW()
      )
    `;

    // 2. Insert Doctor
    const consultationFee = Number(doctor.consultation_fee) || 500;
    const followupFee = Number(doctor.followup_fee) || Math.round(consultationFee * 0.4);
    const services = Array.isArray(doctor.services) ? doctor.services : ["General Consultation"];

    await sql`
      INSERT INTO doctors (
        id, slug, full_name, title, specialization, qualification_summary,
        medical_council_reg_number, medical_council_state, years_of_experience,
        consultation_fee, followup_fee, followup_validity_days, services_offered,
        verification_status, rating, total_reviews,
        clinic_id, clinic_name, clinic_slug, clinic_address,
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
        ${clinicId}, ${clinic.name.trim()}, ${clinicSlug},
        ${clinic.address_line || "Rajpur Road, Dehradun"},
        'Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM',
        ${cleanPhone}, ${ai_bio || doctor.full_name + " is a specialist in Dehradun."},
        NOW()
      )
    `;

    // 3. Create or link user account so doctor can log in immediately
    let userId: string;
    const existingUser = await sql`SELECT id FROM user_accounts WHERE phone = ${cleanPhone} LIMIT 1`;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      await sql`
        UPDATE user_accounts
        SET role = 'doctor', is_verified = true
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
          'doctor', true, true, NOW()
        )
      `;
    }

    // 4. Create clinic membership
    const membershipId = crypto.randomUUID();
    await sql`
      INSERT INTO clinic_memberships (
        id, user_id, clinic_id, role, is_active, created_at
      ) VALUES (
        ${membershipId}, ${userId}, ${clinicId}, 'doctor', true, NOW()
      )
    `;

    // 5. Sign token for instant session
    const accessToken = signAccessToken({
      sub: userId,
      role: "doctor",
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
      doctor_url: `/doctors/${docSlug}`,
      clinic_url: `/clinics/${clinicSlug}`,
      access_token: accessToken,
      message: `Congratulations ${doctor.full_name}! Your clinic is now officially online and bookable.`,
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
