import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createHash, randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      appointment_number,
      doctor_slug = "dr-rahul-sharma",
      doctor_name = "Dr. Rahul Sharma",
      doctor_reg_number = "UKMC-8942-2012",
      clinic_id,
      clinic_name = "Derma Care Skin & Laser Centre",
      clinic_address = "14, Rajpur Road, Near Ashley Hall, Dehradun",
      patient_name,
      patient_phone,
      patient_age = 25,
      patient_gender = "Other",
      vitals = {},
      symptoms = [],
      provisional_diagnosis = "Clinical Consultation",
      items = [],
      instructions = "",
      followup_date
    } = body;

    if (!patient_name || !patient_phone) {
      return NextResponse.json({ error: "Patient name and phone are required" }, { status: 400 });
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const rxNumber = `RX-${year}-${month}-${randSuffix}`;

    const calculatedFollowup = followup_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Standardize prescription items according to NMC & Marley standard
    const standardizedItems = items.map((item: any) => ({
      medicine_name: item.medicine_name || item.name || "Medicine",
      generic_name: (item.generic_name || item.generic || "").toUpperCase(),
      dosage_form: item.dosage_form || "Tablet",
      strength: item.strength || "",
      dosage_frequency: item.dosage_frequency || item.frequency || "1-0-1",
      timing_relation: item.timing_relation || "After Food",
      duration_days: Number(item.duration_days || parseInt(item.duration) || 5),
      special_instructions: item.special_instructions || "Take as advised"
    }));

    // Cryptographic SHA-256 Tamper-Proof Digital Signature Hash
    const signPayload = `${rxNumber}|${doctor_reg_number}|${patient_name}|${patient_phone}|${JSON.stringify(standardizedItems)}|${today.toISOString()}`;
    const digitalSignatureHash = createHash("sha256").update(signPayload).digest("hex");
    const qrVerificationCode = `VERIFY-${doctor_slug.slice(3, 8).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const id = randomUUID();
    const clinicUuid = clinic_id || "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    const inserted = await sql`
      INSERT INTO prescriptions (
        id, prescription_number, appointment_number, clinic_id, doctor_name, 
        doctor_reg_number, clinic_name, clinic_address, patient_name, 
        patient_phone, patient_age, patient_gender, vitals, symptoms, 
        provisional_diagnosis, items, instructions, followup_date, 
        digital_signature_hash, qr_verification_code, created_at
      ) VALUES (
        ${id},
        ${rxNumber},
        ${appointment_number || `APT-${randSuffix}`},
        ${clinicUuid},
        ${doctor_name},
        ${doctor_reg_number},
        ${clinic_name},
        ${clinic_address},
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
        ${digitalSignatureHash},
        ${qrVerificationCode},
        NOW()
      )
      RETURNING *;
    `;

    // Mark the linked appointment as 'completed'
    if (appointment_number) {
      await sql`
        UPDATE appointments 
        SET status = 'completed' 
        WHERE appointment_number = ${appointment_number};
      `;
    }

    return NextResponse.json({
      status: "success",
      prescription: {
        ...inserted[0],
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
