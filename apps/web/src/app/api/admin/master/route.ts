import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Platform-wide administration. Super admin only, across every tenant. */
const superAdmin = (req: NextRequest) =>
  guard(req, {
    roles: ["super_admin"],
    requireClinic: false,
    allowPlatformScope: true,
  });

const ALLOWED_PLANS = [
  "solo",
  "starter",
  "solo_practice",
  "polyclinic",
  "growth",
  "multi_clinic",
  "enterprise",
  "trial",
];

export async function GET(req: NextRequest) {
  try {
    const auth = await superAdmin(req);
    if (!auth.ok) return auth.response;

    const clinics = await sql`
      SELECT *
      FROM clinics c
      ORDER BY c.created_at DESC NULLS LAST, c.name ASC;
    `;

    const doctors = await sql`
      SELECT id, slug, full_name, specialization, consultation_fee, clinic_id, clinic_slug, phone
      FROM doctors
      WHERE is_active = true;
    `;

    const todayApts = await sql`
      SELECT
        clinic_id,
        COUNT(*)::int AS total_tokens,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_tokens,
        COUNT(*) FILTER (WHERE status IN ('waiting', 'in_consultation'))::int AS active_tokens,
        COALESCE(SUM(fee_amount), 0) AS total_volume
      FROM appointments
      WHERE created_at::date = CURRENT_DATE OR appointment_date = CURRENT_DATE::text
      GROUP BY clinic_id;
    `;

    const beds = await sql`
      SELECT
        clinic_slug,
        COUNT(*)::int AS total_beds,
        COUNT(*) FILTER (WHERE status = 'occupied')::int AS occupied_beds
      FROM clinic_beds
      GROUP BY clinic_slug;
    `;

    const allTimeApts = await sql`
      SELECT
        clinic_id,
        COUNT(*)::int AS all_time_tokens,
        COALESCE(SUM(fee_amount), 0) AS all_time_gmv
      FROM appointments
      GROUP BY clinic_id;
    `;

    // Plan pricing is owned by the organization record. No hardcoded rate card.
    const organizations = await sql`
      SELECT id, name, slug, plan_type, plan_price_inr, max_doctors, subscription_status
      FROM organizations;
    `;

    let totalNetworkMRR = 0;
    let totalPaidClinics = 0;
    let totalTrialClinics = 0;
    let totalDueClinics = 0;
    let totalSuspendedClinics = 0;
    let totalPlatformGMVToday = 0;
    let totalTokensToday = 0;
    let totalBedsNetwork = 0;
    let totalOccupiedBedsNetwork = 0;

    const enrichedClinics = clinics.map((c: any) => {
      const org =
        organizations.find((o: any) => String(o.id) === String(c.organization_id)) || null;

      const clinicDoctors = doctors.filter(
        (d: any) =>
          (d.clinic_id && String(d.clinic_id) === String(c.id)) ||
          (d.clinic_slug && d.clinic_slug.toLowerCase() === String(c.slug || "").toLowerCase())
      );

      const aptToday = todayApts.find((a: any) => String(a.clinic_id) === String(c.id)) || {
        total_tokens: 0,
        completed_tokens: 0,
        active_tokens: 0,
        total_volume: 0,
      };

      const aptAllTime = allTimeApts.find((a: any) => String(a.clinic_id) === String(c.id)) || {
        all_time_tokens: 0,
        all_time_gmv: 0,
      };

      const bedData = beds.find(
        (b: any) =>
          b.clinic_slug && String(b.clinic_slug).toLowerCase() === String(c.slug || "").toLowerCase()
      ) || { total_beds: 0, occupied_beds: 0 };

      const status = c.subscription_status ? String(c.subscription_status).toLowerCase() : null;
      const monthlyFee = org?.plan_price_inr == null ? null : Number(org.plan_price_inr);

      if (monthlyFee != null) {
        if (status === "active" || status === "paid") {
          totalPaidClinics++;
          totalNetworkMRR += monthlyFee;
        } else if (status === "trial") {
          totalTrialClinics++;
        } else if (status === "due" || status === "due_soon") {
          totalDueClinics++;
        } else if (status === "suspended") {
          totalSuspendedClinics++;
        }
      } else if (status === "suspended") {
        totalSuspendedClinics++;
      }

      totalPlatformGMVToday += Number(aptToday.total_volume || 0);
      totalTokensToday += Number(aptToday.total_tokens || 0);
      totalBedsNetwork += Number(bedData.total_beds || 0);
      totalOccupiedBedsNetwork += Number(bedData.occupied_beds || 0);

      const expiresAt = c.subscription_expires_at ? new Date(c.subscription_expires_at) : null;
      const daysRemaining =
        expiresAt && !Number.isNaN(expiresAt.getTime())
          ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null;

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        phone: c.phone || null,
        city: c.city || null,
        state: c.state || null,
        address: c.address_line || null,
        upi_vpa: c.upi_vpa || null,
        status: c.status || null,
        subscription_plan: c.subscription_plan || null,
        plan_name: org?.plan_type || null,
        monthly_fee: monthlyFee,
        subscription_status: status,
        subscription_expires_at: expiresAt ? expiresAt.toISOString() : null,
        days_remaining: daysRemaining,
        doctor_count: clinicDoctors.length,
        lead_doctor: clinicDoctors[0]?.full_name || null,
        doctors: clinicDoctors,
        tokens_today: Number(aptToday.total_tokens || 0),
        active_tokens: Number(aptToday.active_tokens || 0),
        completed_tokens: Number(aptToday.completed_tokens || 0),
        gmv_today: Number(aptToday.total_volume || 0),
        all_time_tokens: Number(aptAllTime.all_time_tokens || 0),
        all_time_gmv: Number(aptAllTime.all_time_gmv || 0),
        total_beds: Number(bedData.total_beds || 0),
        occupied_beds: Number(bedData.occupied_beds || 0),
      };
    });

    const kpis = {
      total_clinics: clinics.length,
      paid_clinics: totalPaidClinics,
      trial_clinics: totalTrialClinics,
      due_clinics: totalDueClinics,
      suspended_clinics: totalSuspendedClinics,
      monthly_recurring_revenue: totalNetworkMRR,
      annual_run_rate: totalNetworkMRR * 12,
      today_network_tokens: totalTokensToday,
      today_network_gmv: totalPlatformGMVToday,
      total_beds: totalBedsNetwork,
      occupied_beds: totalOccupiedBedsNetwork,
      network_bed_occupancy_pct:
        totalBedsNetwork > 0
          ? Math.round((totalOccupiedBedsNetwork / totalBedsNetwork) * 100)
          : 0,
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis,
      clinics: enrichedClinics,
    });
  } catch (error: any) {
    console.error("Super Admin Master API error:", error);
    return apiError(500, "Failed to load master admin metrics.", "internal_error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await superAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { clinic_id = null, clinic_slug = null, action } = body;

    if (!clinic_id && !clinic_slug) {
      return apiError(400, "clinic_id or clinic_slug is required.", "clinic_required");
    }
    if (
      body.subscription_plan != null &&
      !ALLOWED_PLANS.includes(String(body.subscription_plan))
    ) {
      return apiError(400, "Unknown subscription_plan.", "invalid_plan");
    }

    const where = clinic_id
      ? sql`id::text = ${String(clinic_id)}::text`
      : sql`lower(slug) = ${String(clinic_slug).toLowerCase()}`;

    const targetRows = await sql`
      SELECT id, slug, name, subscription_plan, subscription_status, subscription_expires_at, status
      FROM clinics
      WHERE ${where}
      LIMIT 1;
    `;
    if (targetRows.length === 0) {
      return apiError(404, "Clinic not found.", "clinic_not_found");
    }
    const target = targetRows[0];
    const targetId = String(target.id);

    let updated: any[] = [];
    let actionName = "";
    let message = "";

    if (action === "record_payment" || action === "renew") {
      const days = body.extend_days == null ? 30 : Number(body.extend_days);
      if (!Number.isInteger(days) || days <= 0 || days > 3660) {
        return apiError(400, "extend_days must be a positive whole number.", "invalid_days");
      }
      const newExpiry = new Date(Date.now() + days * 24 * 3600 * 1000);

      updated = await sql`
        UPDATE clinics
        SET
          subscription_status = 'active',
          subscription_plan = COALESCE(${body.subscription_plan || null}, subscription_plan),
          subscription_expires_at = ${newExpiry},
          status = 'active'
        WHERE id::text = ${targetId}
        RETURNING *;
      `;
      actionName = "platform.subscription.renew";
      message = `Subscription renewed for ${days} days.`;
    } else if (action === "update_status") {
      const newStatus = body.subscription_status ? String(body.subscription_status) : null;
      if (!newStatus) {
        return apiError(400, "subscription_status is required.", "status_required");
      }
      updated = await sql`
        UPDATE clinics
        SET
          subscription_status = ${newStatus},
          subscription_plan = COALESCE(${body.subscription_plan || null}, subscription_plan)
        WHERE id::text = ${targetId}
        RETURNING *;
      `;
      actionName = "platform.subscription.update";
      message = "Clinic subscription status updated.";
    } else if (action === "toggle_lock") {
      const newStatus = String(body.new_status || "");
      if (!["active", "suspended"].includes(newStatus)) {
        return apiError(400, "new_status must be 'active' or 'suspended'.", "invalid_status");
      }
      updated = await sql`
        UPDATE clinics
        SET status = ${newStatus}
        WHERE id::text = ${targetId}
        RETURNING *;
      `;
      actionName = "platform.clinic.access";
      message = `Clinic access ${newStatus === "suspended" ? "suspended" : "activated"}.`;
    } else {
      return apiError(400, "Unknown action specified.", "invalid_action");
    }

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId: targetId,
      action: actionName,
      entity: "clinic",
      entityId: targetId,
      before: {
        subscription_plan: target.subscription_plan,
        subscription_status: target.subscription_status,
        subscription_expires_at: target.subscription_expires_at,
        status: target.status,
      },
      after: {
        subscription_plan: updated[0]?.subscription_plan,
        subscription_status: updated[0]?.subscription_status,
        subscription_expires_at: updated[0]?.subscription_expires_at,
        status: updated[0]?.status,
      },
      request: req,
    });

    return NextResponse.json({
      success: true,
      message,
      clinic: updated[0] || null,
    });
  } catch (error: any) {
    console.error("Super Admin action error:", error);
    return apiError(500, "Failed to process super admin action.", "internal_error");
  }
}
