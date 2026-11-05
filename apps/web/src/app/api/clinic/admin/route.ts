import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, ADMIN_ROLES, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("clinic_slug") || auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    // 1. Fetch clinic base data
    const clinics = await sql`
      SELECT * FROM clinics 
      WHERE lower(slug) = ${slug.toLowerCase().trim()} 
      LIMIT 1;
    `;

    if (clinics.length === 0) {
      return apiError(404, "Clinic not found.", "clinic_not_found");
    }
    const clinic = clinics[0];

    // 2. Fetch doctors linked to this clinic
    const doctors = await sql`
      SELECT id, slug, full_name, specialization, consultation_fee, is_active, chamber_name
      FROM doctors
      WHERE clinic_slug = ${clinic.slug} OR clinic_id::text = ${clinicId}::text
      ORDER BY full_name ASC;
    `;

    const todayStr = new Date().toISOString().split("T")[0];
    const monthStart = `${todayStr.slice(0, 7)}-01`;

    // 3. Global configuration — only values that actually exist for this tenant.
    // Unconfigured fields are returned as null so the console can prompt for them
    // instead of showing invented registrations or bank details.
    const global_config = {
      clinic_name: clinic.name,
      slug: clinic.slug,
      tagline: clinic.tagline || null,
      reg_number: clinic.reg_number || null,
      practice_type: clinic.practice_type || null,
      official_helpline: clinic.phone || null,
      address_line: clinic.address_line || null,
      city: clinic.city || null,
      state: clinic.state || null,
      postal_code: clinic.postal_code || null,
      upi_vpa: clinic.upi_vpa || null,
      organization_id: clinic.organization_id || null,
      subscription_status: clinic.subscription_status || null,
      subscription_plan: clinic.subscription_plan || null,
      subscription_expires_at: clinic.subscription_expires_at || null,
      default_doctor_split:
        clinic.doctor_split_percentage == null
          ? null
          : Number(clinic.doctor_split_percentage),
      // Not modelled in the database yet — surfaced as null, never fabricated.
      gstin: null,
      abdm_facility_id: null,
      nabl_cert_no: null,
      official_email: null,
      bank_account_no: null,
      bank_ifsc: null,
      bank_name: null,
      tax_rates: null,
    };

    // 4. Discount tiers are not yet modelled in the database. Return an empty
    // list rather than inventing codes and percentages the clinic never set.
    const discount_tiers: Array<{
      code: string;
      label: string;
      discount_pct: number;
      applicable_to: string;
      is_active: boolean;
    }> = [];

    // 5. Dynamic Role & Permission Matrix (RBAC)
    const rbac_matrix = {
      super_admin: {
        role_name: "Clinic Owner & Super Admin",
        can_view_all_appointments: true,
        can_write_prescriptions: true,
        can_access_financial_ledgers: true,
        can_edit_tariffs_splits: true,
        can_revoke_user_access: true,
        can_perform_eod_lock: true,
        patient_phone_masked: false,
        can_dispense_pharmacy: true,
        can_access_lab_vault: true
      },
      doctor: {
        role_name: "Consultant Doctor",
        can_view_all_appointments: false,
        can_write_prescriptions: true,
        can_access_financial_ledgers: false,
        can_edit_tariffs_splits: false,
        can_revoke_user_access: false,
        can_perform_eod_lock: false,
        patient_phone_masked: false,
        can_dispense_pharmacy: false,
        can_access_lab_vault: true
      },
      receptionist: {
        role_name: "Front Desk & Billing Desk",
        can_view_all_appointments: true,
        can_write_prescriptions: false,
        can_access_financial_ledgers: false,
        can_edit_tariffs_splits: false,
        can_revoke_user_access: false,
        can_perform_eod_lock: false,
        patient_phone_masked: false,
        can_dispense_pharmacy: false,
        can_access_lab_vault: false
      },
      lab_tech: {
        role_name: "Pathology & Lab Technician",
        can_view_all_appointments: false,
        can_write_prescriptions: false,
        can_access_financial_ledgers: false,
        can_edit_tariffs_splits: false,
        can_revoke_user_access: false,
        can_perform_eod_lock: false,
        patient_phone_masked: true, // DPDP Privacy Guardrail
        can_dispense_pharmacy: false,
        can_access_lab_vault: true
      },
      pharmacist: {
        role_name: "Chemist & Dispensary Incharge",
        can_view_all_appointments: false,
        can_write_prescriptions: false,
        can_access_financial_ledgers: false,
        can_edit_tariffs_splits: false,
        can_revoke_user_access: false,
        can_perform_eod_lock: false,
        patient_phone_masked: true,
        can_dispense_pharmacy: true,
        can_access_lab_vault: false
      }
    };

    // 6. Active staff roster — real memberships joined to real accounts.
    const staffRows = await sql`
      SELECT
        m.id AS membership_id,
        m.role,
        m.is_active,
        m.created_at AS joined_at,
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,
        u.is_active AS account_active,
        u.is_verified,
        u.created_at AS account_created_at
      FROM clinic_memberships m
      JOIN user_accounts u ON u.id::text = m.user_id::text
      WHERE m.clinic_id::text = ${clinicId}::text
      ORDER BY m.is_active DESC, u.full_name ASC;
    `;

    const lastLogins = await sql`
      SELECT actor_id, MAX(created_at) AS last_seen
      FROM audit_events
      WHERE clinic_id::text = ${clinicId}::text
        AND actor_id IS NOT NULL
      GROUP BY actor_id;
    `;
    const lastLoginByUser = new Map<string, string>();
    for (const row of lastLogins) {
      lastLoginByUser.set(String(row.actor_id), String(row.last_seen));
    }

    const staff_users = staffRows.map((s: any) => ({
      membership_id: s.membership_id,
      id: s.user_id,
      name: s.full_name,
      role: s.role,
      email: s.email,
      phone: s.phone,
      is_active: Boolean(s.is_active && s.account_active),
      is_verified: Boolean(s.is_verified),
      joined_at: s.joined_at,
      last_login: lastLoginByUser.get(String(s.user_id)) || null,
    }));

    // 7. Integration status derived from the environment, not asserted.
    const system_integrations = [
      {
        id: "whatsapp_cloud",
        name: "WhatsApp Cloud Business API",
        category: "Messaging Gateway",
        configured: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      },
      {
        id: "razorpay",
        name: "Razorpay Payments",
        category: "Payment Gateway",
        configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      },
      {
        id: "supabase_storage",
        name: "Document Storage (Supabase)",
        category: "Storage",
        configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      },
      {
        id: "sms_otp",
        name: "Patient OTP Delivery",
        category: "Messaging Gateway",
        configured:
          process.env.OTP_DEV_MODE === "true" ||
          Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      },
    ].map((row) => ({ ...row, status: row.configured ? "configured" : "not_configured" }));

    // 8. Financial telemetry — aggregated from real rows for the current month.
    const aptRevenue = await sql`
      SELECT
        COALESCE(SUM(fee_amount), 0) AS gross,
        COALESCE(SUM(CASE WHEN payment_mode IN ('upi', 'online_upi') THEN fee_amount ELSE 0 END), 0) AS upi,
        COALESCE(SUM(CASE WHEN payment_mode = 'cash' THEN fee_amount ELSE 0 END), 0) AS cash
      FROM appointments
      WHERE clinic_id::text = ${clinicId}::text
        AND payment_status = 'paid'
        AND COALESCE(appointment_date, TO_CHAR(created_at, 'YYYY-MM-DD')) >= ${monthStart};
    `;

    const pharmRevenue = await sql`
      SELECT
        COALESCE(SUM(total_amount), 0) AS gross,
        COALESCE(SUM(CASE WHEN payment_mode = 'upi' THEN total_amount ELSE 0 END), 0) AS upi,
        COALESCE(SUM(CASE WHEN payment_mode = 'cash' THEN total_amount ELSE 0 END), 0) AS cash
      FROM pharmacy_dispenses
      WHERE clinic_slug = ${clinic.slug}
        AND created_at::date >= ${monthStart}::date;
    `;

    const monthExpenses = await sql`
      SELECT
        category,
        COALESCE(SUM(amount), 0) AS amount
      FROM expenses
      WHERE clinic_slug = ${clinic.slug}
        AND COALESCE(date, TO_CHAR(created_at, 'YYYY-MM-DD')) >= ${monthStart}
      GROUP BY category
      ORDER BY amount DESC;
    `;

    const payouts = await sql`
      SELECT COALESCE(SUM(net_amount), 0) AS pending
      FROM payout_ledger
      WHERE clinic_id::text = ${clinicId}::text
        AND status IN ('pending', 'approved');
    `;

    const floats = await sql`
      SELECT COALESCE(current_balance, 0) AS balance
      FROM clinic_petty_cash_float
      WHERE clinic_slug = ${clinic.slug}
      LIMIT 1;
    `;

    const grossRevenueMtd =
      Number(aptRevenue[0]?.gross || 0) + Number(pharmRevenue[0]?.gross || 0);
    const upiMtd = Number(aptRevenue[0]?.upi || 0) + Number(pharmRevenue[0]?.upi || 0);
    const cashMtd = Number(aptRevenue[0]?.cash || 0) + Number(pharmRevenue[0]?.cash || 0);
    const expensesMtd = monthExpenses.reduce(
      (sum: number, row: any) => sum + Number(row.amount || 0),
      0
    );
    const pendingDoctorPayouts = Number(payouts[0]?.pending || 0);
    const netProfitMtd = grossRevenueMtd - expensesMtd - pendingDoctorPayouts;

    const monthly_expense_breakdown: Record<string, number> = {};
    for (const row of monthExpenses) {
      monthly_expense_breakdown[String(row.category || "uncategorised")] = Number(
        row.amount || 0
      );
    }

    const financial_kpis = {
      period_start: monthStart,
      period_end: todayStr,
      gross_revenue_mtd: Math.round(grossRevenueMtd * 100) / 100,
      soundbox_upi_inflow: Math.round(upiMtd * 100) / 100,
      cash_collected: Math.round(cashMtd * 100) / 100,
      total_expenses_mtd: Math.round(expensesMtd * 100) / 100,
      real_net_profit_mtd: Math.round(netProfitMtd * 100) / 100,
      profit_margin_pct:
        grossRevenueMtd > 0
          ? Math.round((netProfitMtd / grossRevenueMtd) * 1000) / 10
          : 0,
      pending_doctor_payouts: Math.round(pendingDoctorPayouts * 100) / 100,
      petty_cash_reserve: Number(floats[0]?.balance || 0),
      monthly_expense_breakdown,
    };

    // 9. Administrative audit trail — the real append-only events table.
    const auditRows = await sql`
      SELECT
        e.id,
        e.created_at,
        e.action,
        e.entity,
        e.entity_id,
        e.actor_role,
        e.actor_id,
        u.full_name AS actor_name
      FROM audit_events e
      LEFT JOIN user_accounts u ON u.id::text = e.actor_id::text
      WHERE e.clinic_id::text = ${clinicId}::text
      ORDER BY e.created_at DESC
      LIMIT 50;
    `;

    const audit_logs = auditRows.map((row: any) => ({
      id: row.id,
      timestamp: row.created_at,
      user: row.actor_name || row.actor_id || "system",
      actor_role: row.actor_role,
      action: row.action,
      entity: row.entity,
      entity_id: row.entity_id,
    }));

    return NextResponse.json({
      success: true,
      global_config,
      discount_tiers,
      rbac_matrix,
      staff_users,
      system_integrations,
      financial_kpis,
      audit_logs,
      doctors
    });
  } catch (error: any) {
    console.error("Admin API GET error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Every action here changes tenant configuration, staff access, or billing.
    const auth = await guard(req, { roles: ADMIN_ROLES });
    if (!auth.ok) return auth.response;

    const clinicRows = await sql`
      SELECT * FROM clinics WHERE id::text = ${auth.auth.clinic!.id}::text LIMIT 1;
    `;
    if (clinicRows.length === 0) {
      return apiError(404, "Clinic not found.", "clinic_not_found");
    }
    const clinic: any = clinicRows[0];
    const monthStart = `${new Date().toISOString().split("T")[0].slice(0, 7)}-01`;
    const actorName = `${auth.auth.user.full_name} (${auth.auth.role})`;

    // 1. ACTION: Toggle User Account Lock (Revoke / Restore Staff Access)
    if (action === "toggle_user_lock") {
      const { user_id, is_active } = body;

      if (!user_id || typeof is_active !== "boolean") {
        return apiError(400, "user_id and is_active are required.", "invalid_input");
      }

      // The target must be a member of this clinic. Cross-tenant locks are
      // rejected outright so one clinic cannot disable another's staff.
      const target = await sql`
        SELECT m.id AS membership_id, u.id AS user_id, u.full_name
        FROM clinic_memberships m
        JOIN user_accounts u ON u.id::text = m.user_id::text
        WHERE m.clinic_id::text = ${clinic.id}::text
          AND u.id::text = ${String(user_id)}
        LIMIT 1;
      `;
      if (target.length === 0) {
        return apiError(404, "Staff member not found in your clinic.", "staff_not_found");
      }
      if (String(target[0].user_id) === String(auth.auth.user.id) && !is_active) {
        return apiError(409, "You cannot revoke your own access.", "self_lock_forbidden");
      }

      await sql`
        UPDATE clinic_memberships
        SET is_active = ${is_active}
        WHERE id = ${target[0].membership_id};
      `;

      if (!is_active) {
        // Bump the token version so existing JWTs stop working immediately,
        // and revoke every active session for the account.
        await sql`
          UPDATE user_accounts
          SET token_version = COALESCE(token_version, 1) + 1
          WHERE id::text = ${String(user_id)};
        `;
      }

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId: clinic.id,
        action: is_active ? "staff.access.restore" : "staff.access.revoke",
        entity: "user_account",
        entityId: String(user_id),
        after: { is_active },
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: is_active
          ? `Access restored for ${target[0].full_name}.`
          : `Access revoked for ${target[0].full_name}. All active sessions were invalidated.`,
        user_id,
        is_active,
      });
    }

    // 2. ACTION: RBAC permission overrides are not modelled yet.
    if (action === "update_rbac_permissions") {
      return apiError(
        501,
        "Per-role permission overrides are not implemented. Roles are enforced from clinic_memberships.role.",
        "not_implemented"
      );
    }

    // 3. ACTION: Save Global Clinic Parameters
    if (action === "save_global_config") {
      const { global_config = {} } = body;

      // Only columns that actually exist on clinics are written. Values the
      // schema does not model (GSTIN, bank details, ABDM/NHA IDs) are rejected
      // rather than silently dropped.
      const unmodelled = [
        "gstin",
        "abdm_facility_id",
        "nabl_cert_no",
        "bank_account_no",
        "bank_ifsc",
        "bank_name",
        "official_email",
      ].filter((key) => global_config[key] != null);
      if (unmodelled.length > 0) {
        return apiError(
          400,
          `These fields are not supported by the clinic schema: ${unmodelled.join(", ")}.`,
          "unsupported_fields"
        );
      }

      const updated = await sql`
        UPDATE clinics
        SET
          name = COALESCE(${global_config.clinic_name ?? null}, name),
          tagline = COALESCE(${global_config.tagline ?? null}, tagline),
          reg_number = COALESCE(${global_config.reg_number ?? null}, reg_number),
          phone = COALESCE(${global_config.official_helpline ?? null}, phone),
          upi_vpa = COALESCE(${global_config.upi_vpa ?? null}, upi_vpa),
          address_line = COALESCE(${global_config.address_line ?? null}, address_line),
          city = COALESCE(${global_config.city ?? null}, city),
          state = COALESCE(${global_config.state ?? null}, state),
          postal_code = COALESCE(${global_config.postal_code ?? null}, postal_code),
          doctor_split_percentage = COALESCE(
            ${global_config.default_doctor_split == null ? null : Number(global_config.default_doctor_split)},
            doctor_split_percentage
          )
        WHERE id::text = ${clinic.id}::text
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId: clinic.id,
        action: "clinic.config.update",
        entity: "clinic",
        entityId: clinic.id,
        after: updated[0] || null,
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: `Clinic configuration updated by ${actorName}.`,
        global_config: updated[0] || null,
      });
    }

    // 4. ACTION: Real-Time "What-If" Scenario Simulation Engine
    if (action === "run_what_if_simulation") {
      // Baseline comes from this tenant's actual paid consultations this month,
      // not from assumed values.
      const baseline = await sql`
        SELECT
          COUNT(*)::int AS visits,
          COALESCE(AVG(NULLIF(fee_amount, 0)), 0) AS avg_fee
        FROM appointments
        WHERE clinic_id::text = ${clinic.id}::text
          AND payment_status = 'paid'
          AND COALESCE(appointment_date, TO_CHAR(created_at, 'YYYY-MM-DD')) >= ${monthStart};
      `;

      const currentVolume = Number(baseline[0]?.visits || 0);
      const baseFee = Number(baseline[0]?.avg_fee || 0);
      const monthlyVolume = Number(body.monthly_volume ?? currentVolume);
      const splitPct = Number(
        body.split_pct ??
          clinic.doctor_split_percentage ??
          100
      );
      const feeDelta = Number(body.fee_delta ?? 0);

      if (baseFee === 0 || monthlyVolume === 0) {
        return NextResponse.json({
          success: true,
          simulation: null,
          message:
            "No paid consultations recorded this month, so there is no baseline to simulate against.",
        });
      }

      const newFee = Math.max(0, baseFee + feeDelta);
      const doctorSplitRatio = splitPct / 100;
      const clinicSplitRatio = 1 - doctorSplitRatio;

      const currentMonthlyGross = baseFee * monthlyVolume;
      const projectedMonthlyGross = newFee * monthlyVolume;
      const grossRevenueDelta = projectedMonthlyGross - currentMonthlyGross;

      const currentDoctorPayoutTotal = currentMonthlyGross * doctorSplitRatio;
      const projectedDoctorPayoutTotal = projectedMonthlyGross * doctorSplitRatio;
      const doctorTakeHomePerVisit = newFee * doctorSplitRatio;
      const doctorPerVisitDelta = doctorTakeHomePerVisit - baseFee * doctorSplitRatio;

      const currentClinicRetained = currentMonthlyGross * clinicSplitRatio;
      const projectedClinicRetained = projectedMonthlyGross * clinicSplitRatio;
      const netProfitIncrease = projectedClinicRetained - currentClinicRetained;

      const feeHikePercent = ((newFee - baseFee) / baseFee) * 100;

      return NextResponse.json({
        success: true,
        simulation: {
          baseline_source: "appointments (current month, paid)",
          base_fee: baseFee,
          new_consultation_fee: newFee,
          fee_hike_delta: feeDelta,
          fee_hike_percent: feeHikePercent.toFixed(1),
          doctor_split_pct: splitPct,
          clinic_split_pct: 100 - splitPct,
          monthly_consultations: monthlyVolume,
          current_monthly_gross: currentMonthlyGross,
          projected_monthly_gross: projectedMonthlyGross,
          gross_monthly_delta: grossRevenueDelta,
          current_doctor_payout_total: currentDoctorPayoutTotal,
          projected_doctor_payout_total: projectedDoctorPayoutTotal,
          projected_clinic_net_profit_delta: netProfitIncrease,
          projected_doctor_payout_per_visit: doctorTakeHomePerVisit,
          doctor_payout_per_visit_delta: doctorPerVisitDelta,
          retention_prediction: null,
          elasticity_risk: null,
          summary_text: `Net clinic profit ${netProfitIncrease >= 0 ? "increases" : "decreases"} by ₹${Math.abs(netProfitIncrease).toLocaleString("en-IN")}/month. Payout to doctor becomes ₹${doctorTakeHomePerVisit.toFixed(0)}/visit (${doctorPerVisitDelta >= 0 ? "+" : ""}₹${doctorPerVisitDelta.toFixed(0)}).`,
        },
      });
    }

    // 5. ACTION: Apply Simulation Results to Live Tariffs
    if (action === "apply_simulation_to_live") {
      const { new_fee, split_pct } = body;
      const fee = Number(new_fee);
      const split = Number(split_pct);

      if (!Number.isFinite(fee) || fee <= 0) {
        return apiError(400, "new_fee must be a positive number.", "invalid_fee");
      }
      if (!Number.isFinite(split) || split < 0 || split > 100) {
        return apiError(400, "split_pct must be between 0 and 100.", "invalid_split");
      }

      const tariffId = randomUUID();
      const followupFee = Number(body.followup_fee ?? 0) || 0;
      const followupValidityDays = Number(body.followup_validity_days ?? 0) || 0;

      const insertedTariff = await sql`
        INSERT INTO clinic_tariff_versions (
          id, clinic_slug, effective_from, consultation_fee, followup_fee,
          followup_validity_days, doctor_split_percentage, authorized_by,
          change_reason, is_active
        ) VALUES (
          ${tariffId}, ${clinic.slug}, CURRENT_DATE, ${fee},
          ${followupFee}, ${followupValidityDays}, ${split},
          ${auth.auth.user.full_name},
          'Tariff updated via admin console', true
        )
        RETURNING *;
      `;

      await sql`
        UPDATE doctors
        SET consultation_fee = ${fee}
        WHERE clinic_id::text = ${clinic.id}::text OR clinic_slug = ${clinic.slug};
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId: clinic.id,
        action: "clinic.tariff.apply",
        entity: "clinic",
        entityId: clinic.id,
        after: { consultation_fee: fee, doctor_split_percentage: split },
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: `Consultation tariff updated to ₹${fee} with a ${split}/${100 - split} split.`,
        tariff: insertedTariff[0] || null,
      });
    }

    // 6. ACTION: System sync requires a configured integration.
    if (action === "trigger_system_sync") {
      return apiError(
        501,
        "No external integration sync is configured for this deployment.",
        "not_implemented"
      );
    }

    // 7. ACTION: Onboard New Visiting Doctor to Clinic Roster
    if (action === "onboard_doctor") {
      const { 
        full_name, 
        specialization, 
        consultation_fee, 
        chamber_name, 
        medical_council_reg_number,
        doctor_split_percentage 
      } = body;

      if (!full_name || !specialization) {
        return apiError(400, "Doctor full name and specialization are required.", "invalid_input");
      }
      const fee = Number(consultation_fee);
      const followupFee = Number(body.followup_fee ?? 0) || 0;
      if (!Number.isFinite(fee) || fee <= 0) {
        return apiError(400, "consultation_fee must be a positive number.", "fee_required");
      }
      if (!chamber_name || !String(chamber_name).trim()) {
        return apiError(400, "chamber_name is required.", "chamber_required");
      }
      if (!medical_council_reg_number || !String(medical_council_reg_number).trim()) {
        return apiError(
          400,
          "medical_council_reg_number is required for a practising clinician.",
          "registration_required"
        );
      }

      // Plan guardrail: doctor seat count for this clinic.
      const existingDoctors = await sql`
        SELECT COUNT(*)::int AS count FROM doctors
        WHERE (clinic_id::text = ${clinic.id}::text OR clinic_slug = ${clinic.slug})
          AND is_active = true
      `;
      const currentDoctorCount = Number(existingDoctors[0]?.count || 0);
      const maxAllowedDoctors = clinic.practice_type === "clinic" ? 10 : 1;

      if (currentDoctorCount >= maxAllowedDoctors) {
        return NextResponse.json(
          {
            detail: "Your current plan has reached its doctor seat limit.",
            code: "plan_limit_reached",
            current_count: currentDoctorCount,
            max_allowed: maxAllowedDoctors,
            required_plan: "multi_clinic",
          },
          { status: 403 }
        );
      }

      const cleanName = String(full_name).trim();
      let docSlug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (!docSlug.startsWith("dr-")) docSlug = `dr-${docSlug}`;

      const clash = await sql`SELECT 1 FROM doctors WHERE slug = ${docSlug} LIMIT 1;`;
      if (clash.length > 0) {
        return apiError(409, "A doctor with this name already exists.", "doctor_exists");
      }

      const doctorId = randomUUID();
      const chamber = String(chamber_name).trim();
      const councilReg = String(medical_council_reg_number).trim();
      const splitPct =
        doctor_split_percentage == null
          ? Number(clinic.doctor_split_percentage ?? 100)
          : Number(doctor_split_percentage);

      const created = await sql`
        INSERT INTO doctors (
          id, slug, full_name, specialization, qualification_summary,
          medical_council_reg_number, consultation_fee, followup_fee,
          chamber_name, clinic_slug, clinic_id, is_active, created_at
        ) VALUES (
          ${doctorId}, ${docSlug}, ${cleanName}, ${String(specialization).trim()},
          ${body.qualification_summary ?? null}, ${councilReg}, ${fee}, ${followupFee},
          ${chamber}, ${clinic.slug}, ${clinic.id}, true, NOW()
        )
        RETURNING *;
      `;

      // Record the compensation contract so payouts are never guessed.
      await sql`
        INSERT INTO doctor_compensation_contracts (
          id, doctor_id, clinic_id, split_pct, consumables_policy,
          fixed_fee_inr, effective_from, created_by
        ) VALUES (
          ${randomUUID()}, ${doctorId}, ${clinic.id}, ${splitPct},
          'clinic_bears', 0, CURRENT_DATE, ${auth.auth.user.id}
        );
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId: clinic.id,
        action: "doctor.onboard",
        entity: "doctor",
        entityId: doctorId,
        after: created[0] || null,
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: `Dr. ${cleanName} (${specialization}) onboarded to the clinic roster.`,
        doctor: created[0],
      });
    }

    // 8. ACTION: Change Practice Plan — requires platform (super admin) rights
    // until a paid billing flow exists. Entitlements are never self-granted.
    if (action === "upgrade_plan") {
      if (!auth.auth.isSuperAdmin) {
        return apiError(
          402,
          "Plan changes require a completed payment. Contact support to upgrade.",
          "payment_required"
        );
      }
      const { target_plan = "multi_clinic" } = body;
      const newPlan = target_plan === "multi_clinic" ? "multi_clinic" : "solo_practice";
      const newPracticeType = newPlan === "multi_clinic" ? "clinic" : "solo";
      const newPrice = newPlan === "multi_clinic" ? 1299.00 : 599.00;
      const newMaxDoctors = newPlan === "multi_clinic" ? 10 : 1;

      // Update clinic record
      await sql`
        UPDATE clinics
        SET 
          practice_type = ${newPracticeType},
          subscription_plan = ${newPlan}
        WHERE id::text = ${clinic.id}::text OR slug = ${clinic.slug};
      `;

      if (clinic.organization_id) {
        try {
          await sql`
            UPDATE organizations
            SET 
              practice_type = ${newPracticeType},
              plan_type = ${newPlan},
              plan_price_inr = ${newPrice},
              max_doctors = ${newMaxDoctors},
              updated_at = NOW()
            WHERE id::text = ${clinic.organization_id}::text;
          `;
        } catch (e) {
          console.warn("Organization upgrade warning:", e);
        }
      }

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId: clinic.id,
        action: "clinic.plan.change",
        entity: "clinic",
        entityId: clinic.id,
        after: { practice_type: newPracticeType, subscription_plan: newPlan },
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: `Practice plan changed to ${newPlan} by ${actorName}.`,
        practice_type: newPracticeType,
        plan_type: newPlan,
        plan_price_inr: newPrice,
        max_doctors: newMaxDoctors
      });
    }

    return apiError(400, `Unknown action: ${action}`, "unknown_action");
  } catch (error: any) {
    console.error("Admin API POST error:", error);
    return apiError(500, "Failed to update clinic administration settings.", "internal_error");
  }
}
