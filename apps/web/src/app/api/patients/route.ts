import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createHash, randomUUID } from "crypto";
import { guard, normalisePhone, CLINIC_ROLES, CLINICAL_ROLES, ADMIN_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { clinicToday } from "@/lib/clinic-date";
import { isOtpDevMode, sendOtp } from "@/lib/notifications";
import { generateOtp, hashOtp, OTP_MAX_ATTEMPTS, OTP_TTL_SECONDS, safeEqualHex } from "@/lib/otp";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { 
  checkAllergyConflict, 
  EMRAllergy, 
  HIGH_RISK_ATC_CLASSES,
  CLINICAL_OVERRIDE_REASON_CODES,
  maskEmergencyPhone,
  SeniorDoctorCredential
} from "@/data/emrGovernance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, {
      roles: CLINIC_ROLES,
      audit: "patients.directory_view",
      auditEntity: "emr_patients",
    });
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase();
    const uhidParam = searchParams.get("uhid");

    // 1. Fetch EMR Patients scoped to the authenticated clinic (or all if super admin)
    let patients: any[];
    if (auth.auth.isSuperAdmin) {
      patients = await sql`
        SELECT * FROM emr_patients 
        ORDER BY created_at ASC;
      `;
    } else {
      const clinicId = auth.auth.clinic!.id;
      patients = await sql`
        SELECT DISTINCT p.* FROM emr_patients p
        WHERE RIGHT(REGEXP_REPLACE(p.phone, '[^0-9]', '', 'g'), 10) IN (
          SELECT RIGHT(REGEXP_REPLACE(patient_phone, '[^0-9]', '', 'g'), 10)
          FROM appointments
          WHERE clinic_id::text = ${clinicId}::text
          UNION
          SELECT RIGHT(REGEXP_REPLACE(patient_phone, '[^0-9]', '', 'g'), 10)
          FROM prescriptions
          WHERE clinic_id::text = ${clinicId}::text
          UNION
          SELECT RIGHT(REGEXP_REPLACE(patient_phone, '[^0-9]', '', 'g'), 10)
          FROM patient_documents
          WHERE clinic_id::text = ${clinicId}::text
        )
        ORDER BY p.created_at ASC;
      `;
    }

    if (uhidParam) {
      patients = patients.filter((p: any) => p.uhid === uhidParam);
    }
    if (query) {
      patients = patients.filter((p: any) => 
        p.full_name?.toLowerCase().includes(query) ||
        p.phone?.includes(query) ||
        p.uhid?.toLowerCase().includes(query)
      );
    }

    if (patients.length === 0) {
      return NextResponse.json({
        total: 0,
        patients: []
      });
    }

    const patientUhids = patients.map((p: any) => p.uhid).filter(Boolean);

    // 2. Fetch Allergies scoped to patient UHIDs
    const allergies = await sql`
      SELECT * FROM emr_allergies 
      WHERE is_active = true
        AND patient_uhid = ANY(${patientUhids})
      ORDER BY created_at DESC;
    `;

    // 3. Fetch Lab Results scoped to patient UHIDs
    const labResults = await sql`
      SELECT * FROM emr_lab_vault 
      WHERE patient_uhid = ANY(${patientUhids})
      ORDER BY report_date ASC, created_at ASC;
    `;

    // 4. Fetch Clinical Visits scoped to patient UHIDs
    const visits = await sql`
      SELECT * FROM emr_clinical_visits 
      WHERE patient_uhid = ANY(${patientUhids})
      ORDER BY visit_date DESC, version DESC;
    `;

    // 5. Fetch Audit Trail entries scoped to patient UHIDs
    const auditEntries = await sql`
      SELECT * FROM emr_audit_trail 
      WHERE patient_uhid = ANY(${patientUhids})
      ORDER BY created_at DESC;
    `;

    // 6. Fetch Duplicate Merge Tickets
    const mergeTickets = await sql`
      SELECT * FROM emr_duplicate_merges 
      WHERE source_uhid = ANY(${patientUhids}) OR target_uhid = ANY(${patientUhids})
      ORDER BY created_at DESC;
    `;

    // 7. Fetch Secure Watermarked Exports
    let secureExports: any[] = [];
    try {
      secureExports = await sql`
        SELECT * FROM emr_secure_exports 
        WHERE patient_uhid = ANY(${patientUhids})
        ORDER BY created_at DESC;
      `;
    } catch {
      secureExports = [];
    }

    // Map nested data per patient UHID
    const patientsFull = patients.map((p: any) => {
      const patientAllergies = allergies.filter((a: any) => a.patient_uhid === p.uhid);
      const patientLabs = labResults
        .filter((l: any) => l.patient_uhid === p.uhid)
        .map((l: any) => ({
          ...l,
          parameter_value: Number(l.parameter_value) != null && !isNaN(Number(l.parameter_value)) ? Number(l.parameter_value) : l.parameter_value,
          reference_min: Number(l.reference_min) != null && !isNaN(Number(l.reference_min)) ? Number(l.reference_min) : l.reference_min,
          reference_max: Number(l.reference_max) != null && !isNaN(Number(l.reference_max)) ? Number(l.reference_max) : l.reference_max
        }));

      const patientVisits = visits
        .filter((v: any) => v.patient_uhid === p.uhid)
        .map((v: any) => {
          let parsedVitals = v.vitals;
          if (typeof parsedVitals === "string") {
            try {
              parsedVitals = JSON.parse(parsedVitals);
            } catch {
              parsedVitals = {};
            }
          }
          let parsedMeds = v.prescribed_medications;
          if (typeof parsedMeds === "string") {
            try {
              parsedMeds = JSON.parse(parsedMeds);
            } catch {
              parsedMeds = [];
            }
          }
          return {
            ...v,
            vitals: parsedVitals && typeof parsedVitals === "object" ? parsedVitals : {},
            prescribed_medications: Array.isArray(parsedMeds) ? parsedMeds : []
          };
        });

      const patientAudits = auditEntries.filter((a: any) => a.patient_uhid === p.uhid);
      const patientMerges = mergeTickets.filter((m: any) => m.source_uhid === p.uhid || m.target_uhid === p.uhid);
      const patientExports = secureExports.filter((e: any) => e.patient_uhid === p.uhid);

      return {
        id: p.id,
        uhid: p.uhid,
        full_name: p.full_name,
        phone: p.phone,
        dob: p.dob ? new Date(p.dob).toISOString().split("T")[0] : null,
        age: p.age,
        gender: p.gender,
        blood_group: p.blood_group,
        emergency_contact: p.emergency_contact,
        emergency_contact_relationship: p.emergency_contact_relationship || null,
        emergency_contact_phone: p.emergency_contact_phone || null,
        emergency_contact_consent_status: p.emergency_contact_consent_status || null,
        emergency_contact_consent_date: p.emergency_contact_consent_date || null,
        emergency_contact_encrypted_hash: p.emergency_contact_encrypted_hash || null,
        identity_hash: p.identity_hash,
        is_duplicate_flagged: p.is_duplicate_flagged,
        merged_into_uhid: p.merged_into_uhid,
        allergies: patientAllergies,
        lab_results: patientLabs,
        visits: patientVisits,
        audit_trail: patientAudits,
        duplicate_tickets: patientMerges,
        secure_exports: patientExports
      };
    });

    let result = patientsFull;

    if (uhidParam) {
      result = result.filter(p => p.uhid === uhidParam);
    }

    if (query) {
      result = result.filter(p =>
        p.full_name.toLowerCase().includes(query) ||
        p.phone.includes(query) ||
        p.uhid.toLowerCase().includes(query) ||
        p.allergies.some((a: any) => a.allergen_name.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({
      patients: result,
      metrics: {
        total_patients: patients.length,
        active_allergies_count: allergies.length,
        lab_parameters_indexed: labResults.length,
        immutable_visits_count: visits.length,
        pending_duplicate_merges: mergeTickets.filter((m: any) => m.status === "PENDING_DUAL_ADMIN").length
      }
    });
  } catch (error: any) {
    console.error("GET /api/patients error:", error);
    return NextResponse.json({ error: error.message || "Failed to load EMR directory" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { action = "check_allergy" } = body;

    // =========================================================================
    // FIX 1: ACTIVE ALLERGY CONTRAINDICATION ENGINE & HARD-STOP CHECK
    // =========================================================================
    if (action === "check_allergy") {
      const { patient_uhid, drug_name } = body;
      if (!patient_uhid || !drug_name) {
        return NextResponse.json({ error: "patient_uhid and drug_name are required" }, { status: 400 });
      }

      const allergies = await sql`
        SELECT * FROM emr_allergies 
        WHERE patient_uhid = ${patient_uhid} AND is_active = true;
      `;

      const conflict = checkAllergyConflict(drug_name, allergies as any[]);

      if (conflict) {
        // Record hard-stop block in contraindications log
        await sql`
          INSERT INTO emr_allergy_contraindications (
            patient_uhid, prescribed_drug, conflicting_allergy, atc_code,
            action_taken, override_doctor_name, override_doctor_pin_verified
          ) VALUES (
            ${patient_uhid},
            ${drug_name},
            ${conflict.conflicting_allergy?.allergen_name || "Documented Allergy"},
            ${conflict.atc_code},
            'HARD_STOP_BLOCKED',
            'System Security Gateway',
            false
          );
        `;

        // Log in DPDP audit trail
        await sql`
          INSERT INTO emr_audit_trail (
            patient_uhid, action_type, user_name, user_role, details
          ) VALUES (
            ${patient_uhid},
            'HARD_STOP_BLOCKED',
            'Clinical Safety Engine',
            'Automated Safety Guard',
            ${`Blocked prescription attempt of ${drug_name} due to ${conflict.conflicting_allergy?.allergen_name} contraindication.`}
          );
        `;

        return NextResponse.json({
          blocked: true,
          conflict
        });
      }

      return NextResponse.json({
        blocked: false,
        message: "No active allergy contraindications detected for this drug."
      });
    }

    // =========================================================================
    // FIX 2: CLINICAL OVERRIDE OF ALLERGY HARD-STOP (council registration on file)
    // =========================================================================
    if (action === "override_allergy") {
      const { 
        patient_uhid, 
        prescribed_drug, 
        conflicting_allergy, 
        atc_code, 
        reason_code, 
        reason_text
      } = body;

      // Role & council-registration check via the authenticated session
      let seniorDoctor: SeniorDoctorCredential;
      const auth = await guard(req, { roles: ["doctor", "owner", "clinic_admin"] });
      if (!auth.ok) return auth.response;

      // The override must be signed by a doctor whose council registration is
      // actually on file. Nothing is substituted: no placeholder registration
      // number and no invented council, so the audit trail cannot claim a
      // credential the account does not hold.
      const regNumber = String(
        auth.auth.doctor?.medical_council_reg_number || ""
      ).trim();
      if (!auth.auth.doctor || !regNumber) {
        return NextResponse.json(
          {
            error:
              "No doctor profile with a council registration number is linked to this account. An allergy override cannot be signed.",
          },
          { status: 422 }
        );
      }
      seniorDoctor = {
        doctor_name: auth.auth.doctor.full_name,
        role: auth.auth.role,
        nmc_reg_number: regNumber,
        state_medical_council:
          auth.auth.doctor.medical_council_state ||
          auth.auth.clinic?.state ||
          "",
        specialization: auth.auth.doctor.specialization,
        is_active: true,
      };

      if (!reason_code || !reason_text) {
        return NextResponse.json({ error: "Clinical reason code and explanation are mandatory for override." }, { status: 400 });
      }

      // Check predefined reason code
      const validCode = CLINICAL_OVERRIDE_REASON_CODES.find(c => c.code === reason_code);
      const reasonLabel = validCode ? validCode.label : reason_code;

      const id = randomUUID();
      const contraindication = await sql`
        INSERT INTO emr_allergy_contraindications (
          id, patient_uhid, prescribed_drug, conflicting_allergy, atc_code,
          action_taken, override_reason_code, override_reason_text,
          override_doctor_name, override_doctor_role, override_doctor_nmc_reg,
          nmc_status_verified, persisted_to_pharmacy, persisted_to_lis, override_doctor_pin_verified
        ) VALUES (
          ${id},
          ${patient_uhid},
          ${prescribed_drug},
          ${conflicting_allergy},
          ${atc_code || "J01"},
          'CLINICAL_OVERRIDE_APPROVED',
          ${reason_code},
          ${reason_text},
          ${seniorDoctor.doctor_name},
          ${seniorDoctor.role},
          ${seniorDoctor.nmc_reg_number},
          false,
          false,
          false,
          false
        ) RETURNING *;
      `;

      await sql`
        INSERT INTO emr_audit_trail (
          patient_uhid, action_type, user_name, user_role, details
        ) VALUES (
          ${patient_uhid},
          'OVERRIDE_ALLERGY',
          ${`${seniorDoctor.doctor_name} (${seniorDoctor.nmc_reg_number})`},
          ${seniorDoctor.role},
          ${`Authorized hard-stop override for ${prescribed_drug} with protocol: ${reasonLabel}. Registration on file: ${seniorDoctor.nmc_reg_number} (${seniorDoctor.state_medical_council || "council not recorded"}). Recorded in the EMR allergy-contraindication log. Justification: ${reason_text}`}
        );
      `;

      return NextResponse.json({
        success: true,
        message: `Clinical Override signed by ${seniorDoctor.doctor_name} (registration on file: ${seniorDoctor.nmc_reg_number}). Hard-stop released and recorded in the EMR audit trail.`,
        record: contraindication[0],
        verified_doctor: seniorDoctor
      });
    }

    // =========================================================================
    // FIX 2: STRUCTURED LAB DATA INGESTION (HL7 / FHIR OCR Parser)
    // =========================================================================
    if (action === "ingest_lab_report") {
      const {
        patient_uhid,
        test_name,
        parameter_name,
        parameter_value,
        unit,
        reference_min,
        reference_max,
        report_date = clinicToday(),
        lab_source = "Manual lab entry"
      } = body;

      if (!patient_uhid || !parameter_name || parameter_value === undefined) {
        return NextResponse.json({ error: "patient_uhid, parameter_name, and parameter_value are required" }, { status: 400 });
      }

      const val = Number(parameter_value);
      const min = Number(reference_min || 0);
      const max = Number(reference_max || 100);

      let flag = "NORMAL";
      if (val > max * 1.3) flag = "CRITICAL_HIGH";
      else if (val > max) flag = "HIGH";
      else if (val < min * 0.7) flag = "CRITICAL_LOW";
      else if (val < min) flag = "LOW";

      const id = randomUUID();
      const inserted = await sql`
        INSERT INTO emr_lab_vault (
          id, patient_uhid, test_name, parameter_name, parameter_value,
          unit, reference_min, reference_max, flag, report_date, lab_source
        ) VALUES (
          ${id},
          ${patient_uhid},
          ${test_name || `${parameter_name} Panel`},
          ${parameter_name},
          ${val},
          ${unit || ""},
          ${min},
          ${max},
          ${flag},
          ${report_date},
          ${lab_source}
        ) RETURNING *;
      `;

      await sql`
        INSERT INTO emr_audit_trail (
          patient_uhid, action_type, user_name, user_role, details
        ) VALUES (
          ${patient_uhid},
          'VIEW_RECORD',
          ${auth.auth.user.full_name},
          ${auth.auth.role},
          ${`Ingested structured lab parameter: ${parameter_name} = ${val} ${unit} (${flag}). Plotted on historical trend.`}
        );
      `;

      return NextResponse.json({
        success: true,
        message: `✓ Lab parameter ${parameter_name} ingested with flag: ${flag}. Historical trend updated.`,
        lab_result: inserted[0]
      });
    }

    // =========================================================================
    // FIX 3: IMMUTABLE VISIT DOCUMENTATION (Create Addendum / New Version)
    // =========================================================================
    if (action === "add_visit_version") {
      const {
        patient_uhid,
        visit_number,
        doctor_specialization = "",
        provisional_diagnosis = null,
        vitals = {},
        subjective_notes = null,
        objective_findings = null,
        assessment_plan = null,
        prescribed_medications = [],
        amendment_reason,
      } = body;

      if (!patient_uhid || !visit_number || !amendment_reason) {
        return NextResponse.json({ error: "patient_uhid, visit_number, and amendment_reason are mandatory" }, { status: 400 });
      }

      let authorizedDoctor = "";
      const auth = await guard(req, { roles: ["owner", "clinic_admin", "doctor"] });
      if (!auth.ok) return auth.response;
      authorizedDoctor = `${auth.auth.user.full_name} (${auth.auth.role})`;

      // Find current latest version
      const existing = await sql`
        SELECT MAX(version) AS max_v FROM emr_clinical_visits
        WHERE patient_uhid = ${patient_uhid} AND visit_number = ${visit_number};
      `;
      const nextVersion = (Number(existing[0]?.max_v) || 1) + 1;

      // Mark older versions as not latest
      await sql`
        UPDATE emr_clinical_visits
        SET is_latest = false
        WHERE patient_uhid = ${patient_uhid} AND visit_number = ${visit_number};
      `;

      const hashPayload = `${patient_uhid}|${visit_number}|v${nextVersion}|${amendment_reason}|${Date.now()}`;
      const tamperSeal = `SEAL-EMR-${createHash("sha256").update(hashPayload).digest("hex").slice(0, 10).toUpperCase()}`;
      const id = randomUUID();

      const inserted = await sql`
        INSERT INTO emr_clinical_visits (
          id, patient_uhid, visit_number, version, is_latest, specialty_template,
          visit_date, doctor_name, doctor_specialization, provisional_diagnosis,
          vitals, subjective_notes, objective_findings, assessment_plan,
          prescribed_medications, amendment_reason, amended_by, tamper_seal_hash
        ) VALUES (
          ${id},
          ${patient_uhid},
          ${visit_number},
          ${nextVersion},
          true,
          'DERMATOLOGY_FITZPATRICK',
          CURRENT_DATE,
          ${auth.auth.user.full_name},
          ${auth.auth.doctor?.specialization || doctor_specialization || ""},
          ${provisional_diagnosis},
          ${JSON.stringify(vitals)},
          ${subjective_notes},
          ${objective_findings},
          ${assessment_plan},
          ${JSON.stringify(prescribed_medications)},
          ${amendment_reason},
          ${authorizedDoctor},
          ${tamperSeal}
        ) RETURNING *;
      `;

      await sql`
        INSERT INTO emr_audit_trail (
          patient_uhid, action_type, user_name, user_role, details
        ) VALUES (
          ${patient_uhid},
          'EDIT_NOTE',
          ${auth.auth.user.full_name},
          ${auth.auth.role},
          ${`Created immutable version v${nextVersion}.0 Addendum for visit ${visit_number}. Seal: ${tamperSeal}. Reason: ${amendment_reason}`}
        );
      `;

      return NextResponse.json({
        success: true,
        message: `✓ Signed Addendum v${nextVersion}.0 created. Previous versions preserved with immutable audit trail.`,
        visit: inserted[0]
      });
    }

    // =========================================================================
    // FIX 4: DUPLICATE RESOLUTION & DUAL-ADMIN MERGE WORKFLOW
    // =========================================================================
    if (action === "resolve_duplicate_merge") {
      const { ticket_id } = body;

      const auth = await guard(req, { roles: ["owner", "clinic_admin"] });
      if (!auth.ok) return auth.response;
      const approver_2 = `${auth.auth.user.full_name} (${auth.auth.role})`;

      const ticketRows = await sql`
        SELECT * FROM emr_duplicate_merges WHERE id = ${ticket_id} LIMIT 1;
      `;
      if (ticketRows.length === 0) {
        return NextResponse.json({ error: "Merge ticket not found" }, { status: 404 });
      }

      const ticket = ticketRows[0];

      // A merge is a two-person control. The second approver must be a different
      // administrator from the one recorded on the ticket; otherwise a single
      // account could complete both halves of the approval.
      const firstApprover = String(ticket.approver_1 || "").trim();
      if (!firstApprover) {
        return NextResponse.json(
          { error: "This ticket has no first approver on record. It cannot be closed as a dual-admin merge." },
          { status: 409 }
        );
      }
      if (
        firstApprover.toLowerCase().includes(
          auth.auth.user.full_name.trim().toLowerCase()
        )
      ) {
        return NextResponse.json(
          { error: "The second approval must come from a different administrator than the first approver." },
          { status: 409 }
        );
      }

      // Update ticket status to APPROVED_MERGED
      await sql`
        UPDATE emr_duplicate_merges
        SET 
          status = 'APPROVED_MERGED',
          approver_2 = ${approver_2},
          reconciliation_notes = 'Second administrator verified the identity match. Clinical histories re-pointed to the primary UHID.'
        WHERE id = ${ticket_id};
      `;

      // Update source patient to point to target UHID and clear duplicate flag
      await sql`
        UPDATE emr_patients
        SET 
          merged_into_uhid = ${ticket.target_uhid},
          is_duplicate_flagged = false,
          updated_at = NOW()
        WHERE uhid = ${ticket.source_uhid};
      `;

      // Re-point any visits or labs to target UHID
      await sql`UPDATE emr_clinical_visits SET patient_uhid = ${ticket.target_uhid} WHERE patient_uhid = ${ticket.source_uhid};`;
      await sql`UPDATE emr_lab_vault SET patient_uhid = ${ticket.target_uhid} WHERE patient_uhid = ${ticket.source_uhid};`;
      await sql`UPDATE emr_allergies SET patient_uhid = ${ticket.target_uhid} WHERE patient_uhid = ${ticket.source_uhid};`;

      // DPDP Audit entry
      await sql`
        INSERT INTO emr_audit_trail (
          patient_uhid, action_type, user_name, user_role, details
        ) VALUES (
          ${ticket.target_uhid},
          'MERGE_PATIENT',
          ${approver_2},
          ${auth.auth.role},
          ${`Merged duplicate profile ${ticket.source_uhid} into master record ${ticket.target_uhid} after a second administrator approval (first approver: ${firstApprover}).`}
        );
      `;

      return NextResponse.json({
        success: true,
        message: `Merge approved by a second administrator. Profile ${ticket.source_uhid} merged into ${ticket.target_uhid}.`
      });
    }

    // =========================================================================
    // FIX 1: EMERGENCY CONTACT ACCESS & DISPATCH AUDIT (DPDP Consent Control)
    // =========================================================================
    if (action === "access_emergency_contact") {
      const {
        patient_uhid,
        access_reason = "",
        dispatch_action = "UNMASK_CALL" // "UNMASK_CALL" | "SEND_CRITICAL_SMS"
      } = body;
      // The accessing staff identity comes from the authenticated session, never
      // from the request body — otherwise the audit trail could be attributed
      // to anyone the caller names.
      const staff_name = auth.auth.user.full_name;
      const staff_role = auth.auth.role;

      if (!patient_uhid) {
        return NextResponse.json({ error: "patient_uhid is required" }, { status: 400 });
      }

      const pts = await sql`
        SELECT * FROM emr_patients WHERE uhid = ${patient_uhid} LIMIT 1;
      `;
      if (pts.length === 0) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
      const pt = pts[0];

      // No number on file means there is nothing to unmask. Previously the API
      // returned an invented guardian number and a fabricated consent record.
      const contactPhone = String(pt.emergency_contact_phone || "").trim();
      if (contactPhone.replace(/[^0-9]/g, "").length < 10) {
        return NextResponse.json(
          { error: "No emergency contact number is on file for this patient." },
          { status: 404 }
        );
      }
      const relationship =
        pt.emergency_contact_relationship || "Emergency contact";
      const consentStatus =
        pt.emergency_contact_consent_status || "NOT_RECORDED";

      const actionType = dispatch_action === "SEND_CRITICAL_SMS" 
        ? "EMERGENCY_DISPATCH_INITIATED" 
        : "EMERGENCY_CONTACT_ACCESSED";

      const details = dispatch_action === "SEND_CRITICAL_SMS"
        ? `Emergency alert recorded for ${relationship} (${contactPhone}). Staff: ${staff_name} (${staff_role}). Reason: ${access_reason || "not specified"}. Consent status: ${consentStatus}. No SMS gateway is configured, so delivery is not claimed.`
        : `Emergency contact unmasked for ${relationship} (${contactPhone}). Staff: ${staff_name} (${staff_role}). Reason: ${access_reason || "not specified"}. Consent status: ${consentStatus}.`;

      await sql`
        INSERT INTO emr_audit_trail (
          patient_uhid, action_type, user_name, user_role, details
        ) VALUES (
          ${patient_uhid},
          ${actionType},
          ${staff_name},
          ${staff_role},
          ${details}
        );
      `;

      return NextResponse.json({
        success: true,
        unmasked_phone: contactPhone,
        relationship,
        consent_status: consentStatus,
        consent_date: pt.emergency_contact_consent_date || null,
        encrypted_hash: pt.emergency_contact_encrypted_hash || null,
        message: dispatch_action === "SEND_CRITICAL_SMS"
          ? `Emergency alert recorded for ${relationship}. No SMS gateway is configured; the access is logged to the DPDP audit trail.`
          : `Emergency contact unmasked for authorized clinical staff. Access logged to the DPDP audit trail.`
      });
    }

    // =========================================================================
    // FIX 3: SECURE WATERMARKED TIME-BOUND EXPORT (Patient consent OTP)
    // =========================================================================
    if (action === "request_export_otp") {
      const { patient_uhid } = body;
      if (!patient_uhid) {
        return NextResponse.json({ error: "patient_uhid is required" }, { status: 400 });
      }

      const pts = await sql`
        SELECT uhid, phone FROM emr_patients WHERE uhid = ${patient_uhid} LIMIT 1;
      `;
      if (pts.length === 0) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      const phone = normalisePhone(pts[0].phone);
      if (phone.length !== 10) {
        return NextResponse.json(
          { error: "This patient has no valid mobile number on file, so a consent code cannot be issued." },
          { status: 422 }
        );
      }

      const cooldown = await rateLimit(`export-otp:${phone}`, 1, 60);
      if (!cooldown.allowed) {
        return NextResponse.json(tooManyRequests(cooldown.retryAfterSeconds), {
          status: 429,
          headers: { "Retry-After": String(cooldown.retryAfterSeconds) },
        });
      }

      const code = generateOtp();
      const challengeId = randomUUID();
      const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

      await sql`
        INSERT INTO patient_otp_challenges (id, phone, otp_hash, expires_at)
        VALUES (${challengeId}, ${phone}, ${hashOtp(phone, code)}, ${expiresAt.toISOString()});
      `;

      await sendOtp(phone, code);

      await sql`
        INSERT INTO emr_audit_trail (
          patient_uhid, action_type, user_name, user_role, details
        ) VALUES (
          ${patient_uhid},
          'EXPORT_CONSENT_OTP_REQUESTED',
          ${auth.auth.user.full_name},
          ${auth.auth.role},
          ${`Consent code issued to the patient's registered mobile ending ${phone.slice(-2)}. Challenge ${challengeId}. Expires in ${OTP_TTL_SECONDS}s.`}
        );
      `;

      return NextResponse.json({
        ok: true,
        message: `A consent code was sent to the patient's registered mobile ending ${phone.slice(-2)}. It expires in 5 minutes.`,
        expires_in: OTP_TTL_SECONDS,
        ...(isOtpDevMode() && process.env.OTP_DEV_MODE === "true" ? { dev_otp: code } : {}),
      });
    }

    if (action === "create_secure_export") {
      const {
        patient_uhid,
        export_type = "SPECIALIST_REFERRAL",
        recipient_name,
        recipient_id,
        expiry_hours = 48,
        patient_otp
      } = body;

      if (!patient_uhid || !recipient_name || !recipient_id) {
        return NextResponse.json({ error: "patient_uhid, recipient_name, and recipient_id are required" }, { status: 400 });
      }

      const code = String(patient_otp || "").replace(/\D/g, "");
      if (code.length !== 6) {
        return NextResponse.json(
          { error: "A 6-digit patient consent code is required for external data sharing and right-to-access exports." },
          { status: 400 }
        );
      }

      const pts = await sql`
        SELECT uhid, phone FROM emr_patients WHERE uhid = ${patient_uhid} LIMIT 1;
      `;
      if (pts.length === 0) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      const phone = normalisePhone(pts[0].phone);
      if (phone.length !== 10) {
        return NextResponse.json(
          { error: "This patient has no valid mobile number on file, so consent cannot be verified." },
          { status: 422 }
        );
      }

      const challenges = await sql`
        SELECT id, otp_hash, attempts, max_attempts, expires_at, consumed_at
        FROM patient_otp_challenges
        WHERE phone = ${phone}
          AND consumed_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1;
      `;

      const challenge = challenges[0];
      if (!challenge || new Date(challenge.expires_at).getTime() < Date.now()) {
        return NextResponse.json(
          { error: "The patient consent code has expired or was never requested. Send a new code and try again.", code: "otp_expired" },
          { status: 401 }
        );
      }

      const maxAttempts = Number(challenge.max_attempts || OTP_MAX_ATTEMPTS);
      if (Number(challenge.attempts) >= maxAttempts) {
        return NextResponse.json(
          { error: "Too many incorrect attempts. Send a new consent code.", code: "otp_locked" },
          { status: 429 }
        );
      }

      // Record the attempt before comparing so brute force is bounded.
      await sql`
        UPDATE patient_otp_challenges
        SET attempts = attempts + 1
        WHERE id = ${challenge.id};
      `;

      if (!safeEqualHex(String(challenge.otp_hash), hashOtp(phone, code))) {
        return NextResponse.json(
          { error: "Incorrect patient consent code.", code: "otp_invalid" },
          { status: 401 }
        );
      }

      // Single-use: only the first successful verification wins.
      const consumed = await sql`
        UPDATE patient_otp_challenges
        SET consumed_at = now()
        WHERE id = ${challenge.id} AND consumed_at IS NULL
        RETURNING id;
      `;
      if (consumed.length === 0) {
        return NextResponse.json(
          { error: "This consent code has already been used. Send a new one.", code: "otp_consumed" },
          { status: 401 }
        );
      }

      const id = randomUUID();
      const expiresAt = new Date(Date.now() + Number(expiry_hours) * 3600 * 1000).toISOString();
      const expiryDateFormatted = expiresAt.split("T")[0];
      const watermark = `CONFIDENTIAL MEDICAL RECORD • PREPARED FOR ${recipient_id} (${recipient_name}) • EXPIRES ${expiryDateFormatted} • DPDP SEC-12 PROTECTED`;
      const tamperSeal = `SEAL-EXP-SHA256-${createHash("sha256")
        .update(`${id}|${patient_uhid}|${export_type}|${recipient_id}|${expiresAt}|${watermark}`)
        .digest("hex")
        .slice(0, 16)
        .toUpperCase()}`;
      const otpSessionId = `OTP-${challenge.id}`;

      const inserted = await sql`
        INSERT INTO emr_secure_exports (
          id, patient_uhid, export_type, recipient_name, recipient_id,
          patient_otp_verified, otp_session_id, watermark_text, expiry_hours,
          expires_at, tamper_seal_hash
        ) VALUES (
          ${id},
          ${patient_uhid},
          ${export_type},
          ${recipient_name},
          ${recipient_id},
          true,
          ${otpSessionId},
          ${watermark},
          ${Number(expiry_hours)},
          ${expiresAt},
          ${tamperSeal}
        ) RETURNING *;
      `;

      await sql`
        INSERT INTO emr_audit_trail (
          patient_uhid, action_type, user_name, user_role, details
        ) VALUES (
          ${patient_uhid},
          'EXPORT_WATERMARKED_EMR',
          ${auth.auth.user.full_name},
          ${auth.auth.role},
          ${`Watermarked time-bound PDF export generated for ${recipient_name} (${recipient_id}). Protocol: ${export_type}. Validity: ${expiry_hours}h. Patient consent OTP verified (challenge ${challenge.id}). Tamper seal: ${tamperSeal}.`}
        );
      `;

      return NextResponse.json({
        success: true,
        message: `Secure watermarked EMR export generated. Valid for ${expiry_hours} hours. Logged to the DPDP audit trail.`,
        export_record: inserted[0]
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/patients error:", error);
    return NextResponse.json({ error: error.message || "EMR transaction failed" }, { status: 500 });
  }
}
