import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, ADMIN_ROLES, CLINIC_ROLES } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** Public directory fields — never tenant configuration or credentials. */
const PUBLIC_CLINIC_FIELDS = `
  id, slug, name, phone, address_line, city, state, postal_code,
  facilities, opening_hours, status, tagline, subscription_status
`;

const PUBLIC_DOCTOR_FIELDS = `
  id, slug, title, full_name, specialization, qualification_summary,
  years_of_experience, languages_spoken, bio, consultation_fee, followup_fee,
  followup_validity_days, services_offered, rating, total_reviews,
  clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, is_active
`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    // Signed-in staff see their own tenant's full configuration.
    const auth = await guard(req, { roles: CLINIC_ROLES, requireClinic: false });
    const authClinicId = auth.ok ? auth.auth.clinic?.id : null;
    const isSuperAdmin = auth.ok && auth.auth.isSuperAdmin;

    if (slug || id) {
      const rows = id
        ? await sql`SELECT * FROM clinics WHERE id::text = ${id}::text LIMIT 1`
        : await sql`SELECT * FROM clinics WHERE lower(slug) = ${slug!.toLowerCase().trim()} LIMIT 1`;

      if (rows.length === 0) {
        return NextResponse.json({ detail: "Clinic not found" }, { status: 404 });
      }
      const clinic = rows[0];
      const isOwnTenant =
        isSuperAdmin || (authClinicId && String(authClinicId) === String(clinic.id));

      const doctors = isOwnTenant
        ? await sql`
            SELECT * FROM doctors
            WHERE clinic_id::text = ${clinic.id}::text OR lower(clinic_slug) = ${clinic.slug.toLowerCase().trim()}
            ORDER BY is_active DESC NULLS LAST, full_name ASC
          `
        : await sql.unsafe(
            `SELECT ${PUBLIC_DOCTOR_FIELDS} FROM doctors
             WHERE clinic_id::text = $1::text OR lower(clinic_slug) = $2
             ORDER BY is_active DESC NULLS LAST, full_name ASC`,
            [clinic.id, clinic.slug.toLowerCase().trim()]
          );

      if (!isOwnTenant) {
        const publicClinics = await sql.unsafe(
          `SELECT ${PUBLIC_CLINIC_FIELDS} FROM clinics WHERE id::text = $1::text LIMIT 1`,
          [clinic.id]
        );
        return NextResponse.json({ ...publicClinics[0], doctors });
      }

      const tariffVersions = await sql`
        SELECT * FROM clinic_tariff_versions
        WHERE clinic_slug = ${clinic.slug}
        ORDER BY effective_from DESC
      `;

      const shiftGuardrails = await sql`
        SELECT * FROM clinic_shift_guardrails
        WHERE clinic_slug = ${clinic.slug}
        ORDER BY chamber_name ASC, start_time ASC
      `;

      return NextResponse.json({
        ...clinic,
        doctors,
        tariff_versions: tariffVersions,
        shift_guardrails: shiftGuardrails,
      });
    }

    if (auth.ok && auth.auth.clinic) {
      return NextResponse.json(await sql`SELECT * FROM clinics ORDER BY name`);
    }

    const clinics = await sql.unsafe(
      `SELECT ${PUBLIC_CLINIC_FIELDS} FROM clinics ORDER BY name`
    );
    return NextResponse.json(clinics);
  } catch (error: any) {
    console.error("Clinics API GET error:", error);
    return NextResponse.json({ detail: "Failed to load clinics." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Every POST action here changes tenant configuration or clinical rosters.
    const auth = await guard(req, {
      roles: ADMIN_ROLES,
      clinic: body.clinic_slug ? { slug: String(body.clinic_slug) } : undefined,
      audit: `clinic.config.${action || "unknown"}`,
      auditEntity: "clinic",
    });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic?.slug || body.clinic_slug;
    const authorizedName = `${auth.auth.user.full_name} (${auth.auth.role})`;

    // 1. ACTION: Versioned Tariff & Split Creation
    if (action === "version_tariff") {
      const {
        clinic_slug = clinicSlug,
        effective_from,
        consultation_fee,
        followup_fee,
        followup_validity_days,
        doctor_split_percentage,
        change_reason,
      } = body;

      if (!clinic_slug || !change_reason) {
        return NextResponse.json({ detail: "Clinic slug and change reason are mandatory" }, { status: 400 });
      }

      const consultationFee = Number(consultation_fee);
      const followupFee = Number(followup_fee);
      const validityDays = Number(followup_validity_days);
      const splitPct = Number(doctor_split_percentage);

      if (!Number.isFinite(consultationFee) || consultationFee <= 0) {
        return NextResponse.json(
          { detail: "consultation_fee must be a positive number." },
          { status: 400 }
        );
      }
      if (!Number.isFinite(followupFee) || followupFee < 0) {
        return NextResponse.json(
          { detail: "followup_fee must be zero or a positive number." },
          { status: 400 }
        );
      }
      if (!Number.isInteger(validityDays) || validityDays < 0) {
        return NextResponse.json(
          { detail: "followup_validity_days must be a whole number." },
          { status: 400 }
        );
      }
      if (!Number.isFinite(splitPct) || splitPct < 0 || splitPct > 100) {
        return NextResponse.json(
          { detail: "doctor_split_percentage must be between 0 and 100." },
          { status: 400 }
        );
      }

      // Authorization already enforced by the guard above.
      const effectiveDate = effective_from ? new Date(effective_from) : new Date();
      if (Number.isNaN(effectiveDate.getTime())) {
        return NextResponse.json({ detail: "Invalid effective_from date." }, { status: 400 });
      }
      const now = new Date();
      const isCurrentlyActive = effectiveDate <= now;

      // If active today or earlier, deactivate previous active records
      if (isCurrentlyActive) {
        await sql`
          UPDATE clinic_tariff_versions
          SET is_active = false
          WHERE clinic_slug = ${clinic_slug} AND is_active = true
        `;
      }

      // Insert immutable version record
      const newVersion = await sql`
        INSERT INTO clinic_tariff_versions (
          clinic_slug,
          effective_from,
          consultation_fee,
          followup_fee,
          followup_validity_days,
          doctor_split_percentage,
          authorized_by,
          change_reason,
          is_active
        ) VALUES (
          ${clinic_slug},
          ${effectiveDate.toISOString()},
          ${consultationFee},
          ${followupFee},
          ${validityDays},
          ${splitPct},
          ${authorizedName},
          ${change_reason},
          ${isCurrentlyActive}
        )
        RETURNING *;
      `;

      // If effective immediately, synchronize the clinic split and active doctors
      if (isCurrentlyActive) {
        await sql`
          UPDATE clinics
          SET doctor_split_percentage = ${splitPct}
          WHERE lower(slug) = ${String(clinic_slug).toLowerCase().trim()}
        `;

        await sql`
          UPDATE doctors
          SET
            consultation_fee = ${consultationFee},
            followup_fee = ${followupFee},
            followup_validity_days = ${validityDays}
          WHERE clinic_slug = ${clinic_slug}
        `;
      }

      const allVersions = await sql`
        SELECT * FROM clinic_tariff_versions 
        WHERE clinic_slug = ${clinic_slug}
        ORDER BY effective_from DESC
      `;

      return NextResponse.json({
        success: true,
        message: isCurrentlyActive 
          ? "Tariff version published and effective immediately. Historical appointments remain immutable."
          : `Tariff version scheduled to take effect on ${effectiveDate.toLocaleDateString('en-IN')}.`,
        version: newVersion[0],
        tariff_versions: allVersions
      });
    }

    // 2. ACTION: Shift Guardrail with Chamber Overlap Detection
    if (action === "save_shift_guardrail") {
      const {
        id,
        clinic_slug = clinicSlug,
        chamber_name,
        doctor_slug,
        doctor_name,
        shift_name,
        start_time,
        end_time,
        token_cutoff_minutes,
        token_capacity,
        grace_period_mins,
        auto_cancel_unseen
      } = body;

      if (!clinic_slug || !chamber_name || !doctor_slug || !shift_name || !start_time || !end_time) {
        return NextResponse.json({ detail: "Missing required shift parameters" }, { status: 400 });
      }

      // Chamber Overlap Check: Ensure no other doctor occupies the same chamber in the same shift window
      const conflicts = await sql`
        SELECT * FROM clinic_shift_guardrails
        WHERE clinic_slug = ${clinic_slug}
          AND chamber_name = ${chamber_name}
          AND shift_name = ${shift_name}
          AND doctor_slug != ${doctor_slug}
          AND is_active = true
          ${id ? sql`AND id::text != ${id}::text` : sql``}
        LIMIT 1
      `;

      if (conflicts.length > 0) {
        const conflictDoc = conflicts[0];
        return NextResponse.json({
          conflict: true,
          detail: `Chamber Conflict Detected: ${conflictDoc.doctor_name} is already assigned to ${chamber_name} during ${shift_name} (${conflictDoc.start_time} - ${conflictDoc.end_time}). Physical room double-booking is blocked.`
        }, { status: 409 });
      }

      let savedShift;
      if (id) {
        savedShift = await sql`
          UPDATE clinic_shift_guardrails
          SET
            chamber_name = ${chamber_name},
            doctor_slug = ${doctor_slug},
            doctor_name = ${doctor_name},
            shift_name = ${shift_name},
            start_time = ${start_time},
            end_time = ${end_time},
            token_cutoff_minutes = ${Number(token_cutoff_minutes) || 30},
            token_capacity = ${Number(token_capacity) || 25},
            grace_period_mins = ${Number(grace_period_mins) || 15},
            auto_cancel_unseen = ${auto_cancel_unseen ?? true}
          WHERE id::text = ${id}::text
          RETURNING *;
        `;
      } else {
        savedShift = await sql`
          INSERT INTO clinic_shift_guardrails (
            clinic_slug,
            chamber_name,
            doctor_slug,
            doctor_name,
            shift_name,
            start_time,
            end_time,
            token_cutoff_minutes,
            token_capacity,
            grace_period_mins,
            auto_cancel_unseen,
            is_active
          ) VALUES (
            ${clinic_slug},
            ${chamber_name},
            ${doctor_slug},
            ${doctor_name},
            ${shift_name},
            ${start_time},
            ${end_time},
            ${Number(token_cutoff_minutes) || 30},
            ${Number(token_capacity) || 25},
            ${Number(grace_period_mins) || 15},
            ${auto_cancel_unseen ?? true},
            true
          )
          RETURNING *;
        `;
      }

      const allShifts = await sql`
        SELECT * FROM clinic_shift_guardrails 
        WHERE clinic_slug = ${clinic_slug}
        ORDER BY chamber_name ASC, start_time ASC
      `;

      return NextResponse.json({
        success: true,
        shift: savedShift[0],
        shift_guardrails: allShifts
      });
    }

    // 3. ACTION: Delete Shift Guardrail
    if (action === "delete_shift_guardrail") {
      const { id, clinic_slug = clinicSlug } = body;
      if (!id) return NextResponse.json({ detail: "Shift ID required" }, { status: 400 });

      await sql`DELETE FROM clinic_shift_guardrails WHERE id::text = ${id}::text`;

      const allShifts = await sql`
        SELECT * FROM clinic_shift_guardrails 
        WHERE clinic_slug = ${clinic_slug}
        ORDER BY chamber_name ASC, start_time ASC
      `;

      return NextResponse.json({ success: true, shift_guardrails: allShifts });
    }

    // 4. ACTION: Safe Doctor Deactivation & Final Settlement Calculation
    if (action === "offboard_doctor") {
      const { doctor_slug, clinic_slug = clinicSlug, reason } = body;

      if (!doctor_slug) {
        return NextResponse.json({ detail: "Doctor slug is required" }, { status: 400 });
      }

      const clinicId = auth.auth.clinic?.id;
      if (!clinicId) {
        return NextResponse.json({ detail: "Clinic membership required." }, { status: 403 });
      }

      const doctorRows = await sql`
        SELECT id, slug, full_name, clinic_id, clinic_slug
        FROM doctors
        WHERE slug = ${doctor_slug}
          AND (clinic_id::text = ${String(clinicId)}::text OR clinic_slug = ${clinicSlug})
        LIMIT 1;
      `;
      if (doctorRows.length === 0) {
        return NextResponse.json({ detail: "Doctor not found" }, { status: 404 });
      }
      const doctor = doctorRows[0];

      // Real pending payout: paid, completed consultations at this clinic.
      const pending = await sql`
        SELECT COUNT(*)::int AS visits, COALESCE(SUM(fee_amount), 0) AS gross
        FROM appointments
        WHERE doctor_slug = ${doctor_slug}
          AND clinic_id::text = ${String(clinicId)}::text
          AND status = 'completed'
          AND payment_status = 'paid';
      `;
      const pendingVisitsCount = Number(pending[0]?.visits || 0);
      const pendingGrossRevenue = Number(pending[0]?.gross || 0);

      // The payout split comes from the doctor's active compensation contract.
      const todayStr = new Date().toISOString().split("T")[0];
      const contracts = await sql`
        SELECT split_pct, fixed_fee_inr
        FROM doctor_compensation_contracts
        WHERE clinic_id::text = ${String(clinicId)}::text
          AND doctor_id::text = ${String(doctor.id)}::text
          AND effective_from <= ${todayStr}
          AND (effective_to IS NULL OR effective_to >= ${todayStr})
        ORDER BY effective_from DESC
        LIMIT 1;
      `;
      const contract = contracts[0] || null;

      let finalPayout: number | null = null;
      let settlementStatus = "CONTRACT_MISSING";
      if (contract) {
        const splitPct = Number(contract.split_pct);
        const fixedFee =
          contract.fixed_fee_inr == null ? 0 : Number(contract.fixed_fee_inr);
        finalPayout = Math.round((pendingGrossRevenue * splitPct) / 100 + fixedFee);
        settlementStatus = "SETTLED";
      }

      const settlementId = finalPayout == null ? null : `SETTLE-DR-${Date.now().toString().slice(-6)}`;

      const updated = await sql`
        UPDATE doctors
        SET
          is_active = false,
          deactivated_at = NOW(),
          deactivation_reason = ${reason || "Contract Completion / Safe Archive"},
          final_settlement_id = ${settlementId},
          final_payout_amount = ${finalPayout},
          final_settlement_status = ${settlementStatus}
        WHERE slug = ${doctor_slug}
          AND (clinic_id::text = ${String(clinicId)}::text OR clinic_slug = ${clinicSlug})
        RETURNING *;
      `;

      if (updated.length === 0) {
        return NextResponse.json({ detail: "Doctor not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message:
          finalPayout == null
            ? `Doctor ${updated[0].full_name} has been archived. No active compensation contract was found, so no final payout was computed.`
            : `Doctor ${updated[0].full_name} has been safely archived. New appointments are frozen while historical EMR, prescriptions, and billing integrity are preserved.`,
        settlement: {
          settlement_id: settlementId,
          unsettled_visits: pendingVisitsCount,
          gross_revenue: pendingGrossRevenue,
          doctor_net_payout: finalPayout,
          status: settlementStatus,
        },
        doctor: updated[0],
      });
    }

    // 5. ACTION: Reactivate Doctor
    if (action === "reactivate_doctor") {
      const { doctor_slug, manager_pin } = body;

      if (!doctor_slug) {
        return NextResponse.json({ detail: "Doctor slug is required" }, { status: 400 });
      }

      const updated = await sql`
        UPDATE doctors
        SET
          is_active = true,
          deactivated_at = null,
          deactivation_reason = null,
          final_settlement_status = 'NONE'
        WHERE slug = ${doctor_slug}
          AND (clinic_id::text = ${auth.auth.clinic?.id || ""}::text OR clinic_slug = ${clinicSlug})
        RETURNING *;
      `;

      if (updated.length === 0) {
        return NextResponse.json({ detail: "Doctor not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Doctor ${updated[0].full_name} has been successfully reactivated and restored to live roster without data loss.`,
        doctor: updated[0]
      });
    }

    return NextResponse.json({ detail: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Clinics API POST error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      id,
      slug, 
      name, 
      phone, 
      address_line, 
      city, 
      state, 
      postal_code, 
      opening_hours, 
      facilities,
      upi_vpa,
      doctor_split_percentage,
      reg_number,
      tagline,
      consultation_fee,
      followup_fee,
      followup_validity_days,
      doctor_slug
    } = body;

    if (!id && !slug) {
      return NextResponse.json({ detail: "Clinic ID or slug is required" }, { status: 400 });
    }

    // Tenant config: owner/admin of this clinic only. The tenant is derived
    // from the membership, and the body cannot redirect the update.
    const auth = await guard(req, {
      roles: ADMIN_ROLES,
      clinic: { id: id || undefined, slug: slug || undefined },
      audit: "clinic.profile.update",
      auditEntity: "clinic",
      auditEntityId: id || slug || null,
    });
    if (!auth.ok) return auth.response;
    id = auth.auth.clinic!.id;
    slug = auth.auth.clinic!.slug;

    // 1. Update clinic profile
    const updatedClinics = id
      ? await sql`
          UPDATE clinics
          SET
            name = COALESCE(${name || null}, name),
            phone = COALESCE(${phone || null}, phone),
            address_line = COALESCE(${address_line || null}, address_line),
            city = COALESCE(${city || null}, city),
            state = COALESCE(${state || null}, state),
            postal_code = COALESCE(${postal_code || null}, postal_code),
            opening_hours = COALESCE(${opening_hours ? JSON.stringify(opening_hours) : null}::json, opening_hours),
            facilities = COALESCE(${facilities ? JSON.stringify(facilities) : null}::json, facilities),
            upi_vpa = COALESCE(${upi_vpa || null}, upi_vpa),
            doctor_split_percentage = COALESCE(${doctor_split_percentage !== undefined ? Number(doctor_split_percentage) : null}, doctor_split_percentage),
            reg_number = COALESCE(${reg_number || null}, reg_number),
            tagline = COALESCE(${tagline || null}, tagline)
          WHERE id::text = ${id}::text
          RETURNING *;
        `
      : await sql`
          UPDATE clinics
          SET
            name = COALESCE(${name || null}, name),
            phone = COALESCE(${phone || null}, phone),
            address_line = COALESCE(${address_line || null}, address_line),
            city = COALESCE(${city || null}, city),
            state = COALESCE(${state || null}, state),
            postal_code = COALESCE(${postal_code || null}, postal_code),
            opening_hours = COALESCE(${opening_hours ? JSON.stringify(opening_hours) : null}::json, opening_hours),
            facilities = COALESCE(${facilities ? JSON.stringify(facilities) : null}::json, facilities),
            upi_vpa = COALESCE(${upi_vpa || null}, upi_vpa),
            doctor_split_percentage = COALESCE(${doctor_split_percentage !== undefined ? Number(doctor_split_percentage) : null}, doctor_split_percentage),
            reg_number = COALESCE(${reg_number || null}, reg_number),
            tagline = COALESCE(${tagline || null}, tagline)
          WHERE lower(slug) = ${slug.toLowerCase().trim()}
          RETURNING *;
        `;

    if (updatedClinics.length === 0) {
      return NextResponse.json({ detail: "Clinic not found" }, { status: 404 });
    }

    const currentClinic = updatedClinics[0];

    // 2. If fees or doctor rules provided, update associated doctor(s)
    if (consultation_fee !== undefined || followup_fee !== undefined || followup_validity_days !== undefined) {
      if (doctor_slug) {
        await sql`
          UPDATE doctors
          SET
            consultation_fee = COALESCE(${consultation_fee !== undefined ? Number(consultation_fee) : null}, consultation_fee),
            followup_fee = COALESCE(${followup_fee !== undefined ? Number(followup_fee) : null}, followup_fee),
            followup_validity_days = COALESCE(${followup_validity_days !== undefined ? Number(followup_validity_days) : null}, followup_validity_days)
          WHERE slug = ${doctor_slug};
        `;
      } else {
        await sql`
          UPDATE doctors
          SET
            consultation_fee = COALESCE(${consultation_fee !== undefined ? Number(consultation_fee) : null}, consultation_fee),
            followup_fee = COALESCE(${followup_fee !== undefined ? Number(followup_fee) : null}, followup_fee),
            followup_validity_days = COALESCE(${followup_validity_days !== undefined ? Number(followup_validity_days) : null}, followup_validity_days)
          WHERE clinic_slug = ${currentClinic.slug} OR clinic_id::text = ${currentClinic.id}::text;
        `;
      }
    }

    // Return full updated profile
    const doctors = await sql`
      SELECT * FROM doctors 
      WHERE clinic_id::text = ${currentClinic.id}::text OR lower(clinic_slug) = ${currentClinic.slug.toLowerCase()}
      ORDER BY is_active DESC NULLS LAST, full_name ASC
    `;

    return NextResponse.json({
      success: true,
      clinic: currentClinic,
      doctors
    });
  } catch (error: any) {
    console.error("Clinic update error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
