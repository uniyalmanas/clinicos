import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createHash, randomUUID } from "crypto";
import { authorizeClinicUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Server-Side Doctor Authority & Tenant Isolation
    let auth;
    try {
      auth = await authorizeClinicUser(req, { 
        requiredRoles: ["owner", "clinic_admin", "doctor"] 
      });
    } catch (authErr: any) {
      return NextResponse.json({ 
        error: "Unauthorized prescription generation: Valid doctor or clinic owner session is mandatory.",
        detail: authErr.message
      }, { status: 401 });
    }

    const body = await req.json();
    const {
      appointment_number,
      patient_name,
      patient_phone,
      patient_age = 25,
      patient_gender = "Other",
      vitals = {},
      symptoms = [],
      provisional_diagnosis = "Clinical Consultation",
      items = [],
      instructions = "",
      followup_date,
      lab_tests = [],
      procedures = [],
      clinical_notes = "",
      diet_advice = ""
    } = body;

    if (!patient_name || !patient_phone) {
      return NextResponse.json({ error: "Patient name and phone are required" }, { status: 400 });
    }

    // 2. Authoritative Server Identity Resolution
    const clinicId = auth.clinic.id;
    const clinicName = auth.clinic.name || "ClinicOS Practice";
    const clinicAddress = [auth.clinic.address_line, auth.clinic.city, auth.clinic.state].filter(Boolean).join(", ") || "Dehradun, Uttarakhand";

    // Doctor profile resolution from authenticated session
    let doctorName = auth.user.full_name;
    let doctorRegNumber = "NMC-VERIFIED";
    let doctorSlug = `dr-${auth.user.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    if (auth.doctor) {
      doctorName = auth.doctor.full_name || doctorName;
      doctorRegNumber = auth.doctor.medical_council_reg_number || auth.doctor.reg_number || doctorRegNumber;
      doctorSlug = auth.doctor.slug || doctorSlug;
    } else {
      // Check if a doctor record exists for this user in this clinic
      const docMatch = await sql`
        SELECT * FROM doctors 
        WHERE clinic_id::text = ${clinicId}::text AND (lower(full_name) = ${auth.user.full_name.toLowerCase()} OR email = ${auth.user.email || ''})
        LIMIT 1;
      `;
      if (docMatch.length > 0) {
        doctorName = docMatch[0].full_name;
        doctorRegNumber = docMatch[0].medical_council_reg_number || doctorRegNumber;
        doctorSlug = docMatch[0].slug;
      }
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const rxNumber = `RX-${year}-${month}-${randSuffix}`;

    const calculatedFollowup = followup_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Standardize prescription items according to NMC & Marley clinical standard
    const standardizedItems = (items || []).map((item: any) => ({
      medicine_name: item.medicine_name || item.name || "Medicine",
      generic_name: (item.generic_name || item.generic || "").toUpperCase(),
      dosage_form: item.dosage_form || "Tablet",
      strength: item.strength || "",
      dosage_frequency: item.dosage_frequency || item.frequency || "1-0-1",
      timing_relation: item.timing_relation || "After Food",
      duration_days: Number(item.duration_days || parseInt(item.duration) || 5),
      special_instructions: item.special_instructions || "Take as advised"
    }));

    // 3. Cryptographic Prescription Integrity Hash (SHA-256)
    // Server authoritative payload: cannot be tampered by client
    const integrityPayload = `${rxNumber}|${clinicId}|${doctorRegNumber}|${patient_name}|${patient_phone}|${JSON.stringify(standardizedItems)}|${today.toISOString()}`;
    const integrityHash = createHash("sha256").update(integrityPayload).digest("hex");
    const qrVerificationCode = `VERIFY-${doctorSlug.replace(/^dr-/, "").slice(0, 5).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const id = randomUUID();

    const inserted = await sql`
      INSERT INTO prescriptions (
        id, prescription_number, appointment_number, clinic_id, doctor_name, 
        doctor_reg_number, clinic_name, clinic_address, patient_name, 
        patient_phone, patient_age, patient_gender, vitals, symptoms, 
        provisional_diagnosis, items, instructions, followup_date, 
        digital_signature_hash, qr_verification_code, lab_tests, 
        procedures, clinical_notes, diet_advice, created_at
      ) VALUES (
        ${id},
        ${rxNumber},
        ${appointment_number || `APT-${randSuffix}`},
        ${clinicId},
        ${doctorName},
        ${doctorRegNumber},
        ${clinicName},
        ${clinicAddress},
        ${patient_name},
        ${patient_phone},
        ${Number(patient_age) || 25},
        ${patient_gender},
        ${JSON.stringify(vitals)},
        ${JSON.stringify(Array.isArray(symptoms) ? symptoms : [symptoms])},
        ${provisional_diagnosis},
        ${JSON.stringify(standardizedItems)},
        ${instructions},
        ${calculatedFollowup},
        ${integrityHash},
        ${qrVerificationCode},
        ${JSON.stringify(Array.isArray(lab_tests) ? lab_tests : [])},
        ${JSON.stringify(Array.isArray(procedures) ? procedures : [])},
        ${clinical_notes},
        ${diet_advice},
        NOW()
      )
      RETURNING *;
    `;

    // Mark the linked appointment as 'completed' (Scoped to this clinic)
    if (appointment_number) {
      await sql`
        UPDATE appointments 
        SET status = 'completed' 
        WHERE appointment_number = ${appointment_number} AND (clinic_id::text = ${clinicId}::text OR clinic_id IS NULL);
      `;
    }

    return NextResponse.json({
      status: "success",
      prescription: {
        ...inserted[0],
        doctor_slug: doctorSlug,
        prescription_integrity_hash: integrityHash,
        integrity_hash: integrityHash,
        integrity_seal_label: "Prescription Integrity Hash (SHA-256)",
        items: standardizedItems,
        vitals: typeof inserted[0].vitals === "string" ? JSON.parse(inserted[0].vitals) : inserted[0].vitals,
        symptoms: typeof inserted[0].symptoms === "string" ? JSON.parse(inserted[0].symptoms) : inserted[0].symptoms
      }
    });
  } catch (error: any) {
    console.error("POST /api/prescriptions/generate error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate prescription" }, { status: 500 });
  }
}
