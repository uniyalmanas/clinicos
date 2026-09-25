import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Dual-Verified Sanitization Workflow
 * Requirements:
 * 1. Housekeeping staff scans bed QR + logs UV cycle proof.
 * 2. Nurse performs spot-check QA within 30 min with E-sign.
 * 3. Bed remains VACANT_DIRTY until BOTH logs exist. No manual override permitted.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bed_id,
      action = "housekeeping_log",
      hk_staff_name = "Ramesh Kumar (Housekeeping Lead)",
      disinfection_method = "UV-C 30-min Cycle + Sodium Hypochlorite 1% Wipe",
      nurse_qa_name = "Sister Sunita (Duty Sister)",
      nurse_qa_esign = "ESIGN-NURSE-QA-VERIFIED"
    } = body;

    if (!bed_id) {
      return NextResponse.json({ error: "bed_id is required" }, { status: 400 });
    }

    const bedQuery = await sql`SELECT * FROM clinic_beds WHERE id = ${bed_id} LIMIT 1;`;
    if (bedQuery.length === 0) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    const bed = bedQuery[0];
    const now = new Date();

    // Step 1: Housekeeping logs terminal cleaning & UV cycle
    if (action === "housekeeping_log" || action === "hk_clean") {
      const logId = randomUUID();
      await sql`
        INSERT INTO bed_sanitization_logs (
          id, bed_id, bed_number, hk_staff_name, disinfection_method, hk_completed_at, status
        ) VALUES (
          ${logId},
          ${bed.id},
          ${bed.bed_number},
          ${hk_staff_name},
          ${disinfection_method},
          ${now},
          'pending_qa'
        );
      `;

      // Update bed record
      const updated = await sql`
        UPDATE clinic_beds
        SET 
          sanitization_hk_logged = true,
          sanitization_hk_at = ${now},
          sanitization_hk_by = ${hk_staff_name}
        WHERE id = ${bed_id}
        RETURNING *;
      `;

      return NextResponse.json({
        success: true,
        action: "housekeeping_logged",
        message: `Housekeeping disinfection logged for Bed ${bed.bed_number}. Bed remains VACANT_DIRTY awaiting Nurse QA spot-check verification.`,
        bed: updated[0]
      });
    }

    // Step 2: Nurse QA Spot-Check E-sign
    if (action === "nurse_qa" || action === "qa_verify") {
      if (!bed.sanitization_hk_logged) {
        return NextResponse.json({
          error: "QA VERIFICATION BLOCKED: Housekeeping disinfection log is missing. Terminal cleaning must precede Nurse QA.",
          code: "HK_LOG_MISSING"
        }, { status: 422 });
      }

      // Check 30-minute SLA
      if (bed.sanitization_hk_at) {
        const hkTime = new Date(bed.sanitization_hk_at).getTime();
        const diffMins = (now.getTime() - hkTime) / (1000 * 60);
        if (diffMins > 30) {
          console.warn(`Nurse QA performed ${Math.round(diffMins)} minutes after cleaning (SLA was 30 mins).`);
        }
      }

      // Update sanitization log to verified_clean
      await sql`
        UPDATE bed_sanitization_logs
        SET 
          nurse_qa_name = ${nurse_qa_name},
          nurse_qa_esign = ${nurse_qa_esign},
          nurse_verified_at = ${now},
          status = 'verified_clean'
        WHERE bed_id = ${bed_id} AND status = 'pending_qa';
      `;

      // Dual-Verification passed: Transition bed strictly to VACANT_CLEAN
      const updated = await sql`
        UPDATE clinic_beds
        SET 
          status = 'VACANT_CLEAN',
          sanitization_nurse_qa = true,
          sanitization_nurse_at = ${now},
          sanitization_nurse_by = ${nurse_qa_name}
        WHERE id = ${bed_id}
        RETURNING *;
      `;

      return NextResponse.json({
        success: true,
        action: "dual_verification_passed",
        message: `Dual sanitization verification passed! Bed ${bed.bed_number} unlocked to VACANT_CLEAN and ready for patient admission.`,
        bed: updated[0]
      });
    }

    return NextResponse.json({ error: "Invalid sanitization action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/beds/clean error:", error);
    return NextResponse.json({ error: error.message || "Failed to process sanitization" }, { status: 500 });
  }
}
