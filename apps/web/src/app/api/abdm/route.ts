import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { maskAadhaar, ABDM_PURPOSE_CODES } from "@/data/abdmGovernance";
import { createHash, randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await guard(req, { roles: CLINIC_ROLES });
  if (!auth.ok) return auth.response;

  const clinicSlug = auth.auth.clinic!.slug;

  try {
    const patients = await db`
      SELECT * FROM abdm_patients
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY created_at DESC;
    `;

    const consents = await db`
      SELECT * FROM abdm_consent_artefacts
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY created_at DESC;
    `;

    const gatewayLogs = await db`
      SELECT * FROM abdm_gateway_logs
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY created_at DESC
      LIMIT 10;
    `;

    const totalPatients = patients.length;
    const verifiedKyc = patients.filter((p: any) => p.kyc_status === "VERIFIED").length;
    const pendingSync = patients.filter((p: any) => p.kyc_status === "PENDING_NHA_SYNC").length;
    const conflicts = patients.filter((p: any) => p.demographic_conflict).length;

    const activeConsents = consents.filter(
      (c: any) =>
        c.status === "GRANTED" &&
        (!c.expiry_timestamp || new Date(c.expiry_timestamp) > new Date())
    ).length;
    const revokedConsents = consents.filter((c: any) => c.status === "REVOKED").length;

    return NextResponse.json({
      patients,
      consents,
      gateway_logs: gatewayLogs,
      metrics: {
        total_registered: totalPatients,
        verified_kyc: verifiedKyc,
        pending_sync: pendingSync,
        conflicts_count: conflicts,
        active_consents: activeConsents,
        revoked_consents: revokedConsents,
      },
    });
  } catch (error: any) {
    console.error("GET /api/abdm error:", error);
    return apiError(500, "Failed to load ABDM records.", "internal_error");
  }
}

export async function POST(req: NextRequest) {
  const auth = await guard(req, { roles: CLINIC_ROLES });
  if (!auth.ok) return auth.response;

  const clinicId = auth.auth.clinic!.id;
  const clinicSlug = auth.auth.clinic!.slug;
  const actorName = auth.auth.user.full_name;

  try {
    const body = await req.json();
    const { action } = body;

    // -----------------------------------------------------------------------
    // Pre-creation registry check (prevents duplicate ABHA creation)
    // -----------------------------------------------------------------------
    if (action === "registry_check") {
      const { patient_phone, aadhaar_input } = body;
      if (!patient_phone && !aadhaar_input) {
        return apiError(400, "patient_phone or aadhaar_input is required.", "invalid_input");
      }

      const masked = aadhaar_input ? maskAadhaar(aadhaar_input) : null;

      let existing: any[] = [];
      if (patient_phone && masked) {
        existing = await db`
          SELECT * FROM abdm_patients
          WHERE clinic_slug = ${clinicSlug}
            AND (patient_phone = ${patient_phone} OR masked_aadhaar = ${masked})
          LIMIT 1;
        `;
      } else if (patient_phone) {
        existing = await db`
          SELECT * FROM abdm_patients
          WHERE clinic_slug = ${clinicSlug}
            AND patient_phone = ${patient_phone}
          LIMIT 1;
        `;
      } else if (masked) {
        existing = await db`
          SELECT * FROM abdm_patients
          WHERE clinic_slug = ${clinicSlug}
            AND masked_aadhaar = ${masked}
          LIMIT 1;
        `;
      }

      if (existing.length > 0) {
        const found = existing[0];
        return NextResponse.json({
          match_found: true,
          action_recommended: "LINK_EXISTING_ABHA",
          patient: found,
          message: `A local ABDM record already exists for this citizen (${found.abha_number}). Link it to avoid duplicate sandbox records.`,
        });
      }

      return NextResponse.json({
        match_found: false,
        action_recommended: "PROCEED_CREATION",
        message:
          "No existing local ABDM record found for this clinic. A sandbox record can be created; no national registry was queried.",
      });
    }

    // -----------------------------------------------------------------------
    // Local sandbox identity handling; no external identity provider is contacted
    // -----------------------------------------------------------------------
    if (action === "request_otp") {
      const { aadhaar_input, patient_phone } = body;
      if (!aadhaar_input || !patient_phone) {
        return apiError(
          400,
          "aadhaar_input and patient_phone are required.",
          "invalid_input"
        );
      }

      const cleanAadhaar = String(aadhaar_input).replace(/\D/g, "");
      if (![4, 12, 16].includes(cleanAadhaar.length)) {
        return apiError(
          400,
          "Enter at least the last 4 digits, a 12-digit Aadhaar, or a 16-digit VID.",
          "invalid_aadhaar"
        );
      }

      const isVid = cleanAadhaar.length === 16;
      const masked = maskAadhaar(cleanAadhaar);
      const txnId = `TXN-SANDBOX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Log the transient e-KYC request. Raw Aadhaar is never stored.
      await db`
        INSERT INTO abdm_gateway_logs (
          clinic_id, clinic_slug, transaction_id, endpoint, method, status_code, latency_ms, payload_summary
        ) VALUES (
          ${clinicId},
          ${clinicSlug},
          ${txnId},
          '/v2/registration/aadhaar/generateOtp',
          'POST',
          200,
          180,
          ${db.json({ masked_aadhaar: masked, is_vid: isVid })}
        );
      `;

      return NextResponse.json({
        success: true,
        sandbox: true,
        txn_id: txnId,
        masked_aadhaar: masked,
        is_vid: isVid,
        message: `Sandbox mode: a 6-digit code was generated locally for ${masked}. No UIDAI/NHA request was sent.`,
      });
    }

    // -----------------------------------------------------------------------
    // Verify OTP & create ABHA (with resilient fallback)
    // -----------------------------------------------------------------------
    if (action === "verify_otp_create_abha") {
      const {
        patient_name,
        patient_phone,
        masked_aadhaar,
        otp_code,
        simulate_gateway_failure = false,
      } = body;

      const otpDigits = String(otp_code || "").replace(/\D/g, "");
      if (!patient_name || !patient_phone || otpDigits.length !== 6) {
        return apiError(
          400,
          "patient_name, patient_phone, and a 6-digit sandbox code are required.",
          "invalid_input"
        );
      }

      if (simulate_gateway_failure) {
        const fallbackAbha = `SANDBOX-PENDING-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const fallbackAddress = `sandbox-${randomUUID().slice(0, 8)}@abdm.invalid`;
        const id = randomUUID();

        const offlinePatient = await db`
          INSERT INTO abdm_patients (
            id, clinic_id, clinic_slug, abha_number, abha_address, patient_name,
            patient_phone, masked_aadhaar, kyc_status, demographic_conflict,
            conflict_details, nha_sync_attempts, gateway_mode
          ) VALUES (
            ${id},
            ${clinicId},
            ${clinicSlug},
            ${fallbackAbha},
            ${fallbackAddress},
            ${patient_name},
            ${patient_phone},
            ${masked_aadhaar || "XXXX-XXXX-0000"},
            'PENDING_NHA_SYNC',
            false,
            'Sandbox fallback: no NHA gateway is configured, so this record stays pending real verification.',
            1,
            'OFFLINE_QUEUE_FALLBACK'
          ) RETURNING *;
        `;

        await logAudit({
          actorId: auth.auth.user.id,
          actorRole: auth.auth.role,
          clinicId,
          action: "abdm.patient.register.offline",
          entity: "abdm_patient",
          entityId: String(offlinePatient[0].id),
          after: { abha_number: fallbackAbha, patient_name },
          request: req,
        });

        return NextResponse.json({
          success: true,
          offline_fallback: true,
          patient: offlinePatient[0],
          message:
            "Sandbox fallback: record stored locally with PENDING status. No NHA gateway was contacted, so no real ABHA was issued.",
        });
      }

      const part1 = Math.floor(10 + Math.random() * 89);
      const part2 = Math.floor(1000 + Math.random() * 9000);
      const part3 = Math.floor(1000 + Math.random() * 9000);
      const part4 = masked_aadhaar
        ? String(masked_aadhaar).slice(-4)
        : `${Math.floor(1000 + Math.random() * 9000)}`;
      const generatedAbha = `SANDBOX-${part1}-${part2}-${part3}-${part4}`;

      const generatedAddress = `sandbox-${randomUUID().slice(0, 8)}@abdm.invalid`;
      const id = randomUUID();

      const inserted = await db`
        INSERT INTO abdm_patients (
          id, clinic_id, clinic_slug, abha_number, abha_address, patient_name,
          patient_phone, masked_aadhaar, kyc_status, demographic_conflict, gateway_mode
        ) VALUES (
          ${id},
          ${clinicId},
          ${clinicSlug},
          ${generatedAbha},
          ${generatedAddress},
          ${patient_name},
          ${patient_phone},
          ${masked_aadhaar || "XXXX-XXXX-0000"},
          'PENDING_NHA_SYNC',
          false,
          'SANDBOX_M1_M2'
        ) RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "abdm.patient.register",
        entity: "abdm_patient",
        entityId: String(inserted[0].id),
        after: { abha_number: generatedAbha, patient_name },
        request: req,
      });

      return NextResponse.json({
        success: true,
        sandbox: true,
        patient: inserted[0],
        message:
          "Sandbox ABDM record created locally. No NHA gateway is configured, so the simulated identifier is not a real ABHA.",
      });
    }

    // -----------------------------------------------------------------------
    // Dynamic consent artefact engine
    // -----------------------------------------------------------------------
    if (action === "request_consent") {
      const {
        patient_name,
        patient_phone,
        abha_number,
        abha_address,
        purpose_code = "CAREFUL_EPISODE_MANAGEMENT",
        validity_days = 7,
      } = body;

      if (!patient_name || !abha_number) {
        return apiError(400, "patient_name and abha_number are required.", "invalid_input");
      }

      const purpose =
        ABDM_PURPOSE_CODES.find((p) => p.code === purpose_code) || ABDM_PURPOSE_CODES[0];
      const expiry = new Date(
        Date.now() +
          (Number(validity_days) || purpose.default_validity_days) * 24 * 60 * 60 * 1000
      ).toISOString();
      const requestId = `CA-REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const id = randomUUID();

      const inserted = await db`
        INSERT INTO abdm_consent_artefacts (
          id, clinic_id, clinic_slug, consent_request_id, patient_name, patient_phone,
          abha_number, abha_address, hiu_name, purpose_code, purpose_label,
          expiry_timestamp, status
        ) VALUES (
          ${id},
          ${clinicId},
          ${clinicSlug},
          ${requestId},
          ${patient_name},
          ${patient_phone || null},
          ${abha_number},
          ${abha_address || null},
          ${auth.auth.clinic!.name},
          ${purpose.code},
          ${purpose.label},
          ${expiry},
          'REQUESTED'
        ) RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "abdm.consent.request",
        entity: "abdm_consent_artefact",
        entityId: String(inserted[0].id),
        after: { consent_request_id: requestId, purpose_code: purpose.code },
        request: req,
      });

      return NextResponse.json({
        success: true,
        consent_request: inserted[0],
        message: `Sandbox consent request ${requestId} recorded for ${purpose.label}. No request was transmitted to the citizen or to an NHA gateway.`,
      });
    }

    if (action === "verify_consent_otp") {
      const { consent_request_id, otp_code } = body;
      if (!consent_request_id) {
        return apiError(400, "consent_request_id is required.", "invalid_input");
      }
      if (String(otp_code || "").replace(/\D/g, "").length !== 6) {
        return apiError(400, "A 6-digit sandbox consent code is required.", "invalid_input");
      }

      const rows = await db`
        SELECT * FROM abdm_consent_artefacts
        WHERE consent_request_id = ${consent_request_id}
          AND clinic_slug = ${clinicSlug}
        LIMIT 1;
      `;
      if (rows.length === 0) {
        return apiError(404, "Consent request not found in your clinic.", "consent_not_found");
      }

      const caId = `CA-ART-SANDBOX-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const tokenPayload = `${caId}|${rows[0].abha_number}|${rows[0].purpose_code}|${rows[0].expiry_timestamp}`;
      const tokenHash = createHash("sha256").update(tokenPayload).digest("hex");

      const updated = await db`
        UPDATE abdm_consent_artefacts
        SET
          consent_artefact_id = ${caId},
          status = 'GRANTED',
          ca_token_hash = ${tokenHash},
          updated_at = NOW()
        WHERE consent_request_id = ${consent_request_id}
          AND clinic_slug = ${clinicSlug}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "abdm.consent.grant",
        entity: "abdm_consent_artefact",
        entityId: String(updated[0].id),
        after: { consent_artefact_id: caId },
        request: req,
      });

      return NextResponse.json({
        success: true,
        consent_artefact: updated[0],
        message: `Sandbox consent artefact ${caId} marked GRANTED locally. No NHA citizen OTP was verified; this artefact is not valid outside this demo.`,
      });
    }

    if (action === "revoke_consent") {
      const { consent_request_id, revoked_by } = body;
      if (!consent_request_id) {
        return apiError(400, "consent_request_id is required.", "invalid_input");
      }

      const updated = await db`
        UPDATE abdm_consent_artefacts
        SET
          status = 'REVOKED',
          revoked_at = NOW(),
          revoked_by = ${revoked_by || actorName},
          ca_token_hash = NULL,
          updated_at = NOW()
        WHERE consent_request_id = ${consent_request_id}
          AND clinic_slug = ${clinicSlug}
        RETURNING *;
      `;
      if (updated.length === 0) {
        return apiError(404, "Consent request not found in your clinic.", "consent_not_found");
      }

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "abdm.consent.revoke",
        entity: "abdm_consent_artefact",
        entityId: String(updated[0].id),
        after: { revoked_by: revoked_by || actorName },
        request: req,
      });

      return NextResponse.json({
        success: true,
        consent_artefact: updated[0],
        message:
          "Sandbox consent revoked locally; the local access token is locked.",
      });
    }

    // -----------------------------------------------------------------------
    // Sync offline queue
    // -----------------------------------------------------------------------
    if (action === "sync_offline_queue") {
      const pending = await db`
        SELECT * FROM abdm_patients
        WHERE kyc_status = 'PENDING_NHA_SYNC'
          AND clinic_slug = ${clinicSlug};
      `;

      for (const p of pending) {
        await db`
          UPDATE abdm_patients
          SET
            nha_sync_attempts = nha_sync_attempts + 1,
            conflict_details = 'Sandbox: sync attempted locally. No NHA gateway is configured; record remains pending real verification.',
            updated_at = NOW()
          WHERE id = ${p.id}
            AND clinic_slug = ${clinicSlug};
        `;
      }

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "abdm.queue.sync",
        entity: "abdm_patient",
        after: { attempted_count: pending.length, synced_count: 0 },
        request: req,
      });

      return NextResponse.json({
        success: true,
        synced_count: 0,
        pending_count: pending.length,
        message: `No NHA gateway is configured on this deployment. ${pending.length} sandbox record(s) remain pending real verification.`,
      });
    }

    return apiError(400, "Invalid action.", "invalid_action");
  } catch (error: any) {
    console.error("POST /api/abdm error:", error);
    return apiError(500, "ABDM processing failed.", "internal_error");
  }
}
