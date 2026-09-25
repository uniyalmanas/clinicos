import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch all clinics
    const clinics = await sql`
      SELECT 
        c.*,
        COALESCE(c.subscription_plan, 'starter') as plan,
        COALESCE(c.subscription_status, 'active') as sub_status
      FROM clinics c
      ORDER BY c.created_at DESC NULLS LAST, c.name ASC;
    `;

    // 2. Fetch doctors linked to clinics
    const doctors = await sql`
      SELECT id, slug, full_name, specialization, consultation_fee, clinic_id, clinic_slug, phone
      FROM doctors;
    `;

    // 3. Fetch today's appointment telemetry
    const todayApts = await sql`
      SELECT 
        clinic_id,
        COUNT(*) as total_tokens,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tokens,
        COUNT(*) FILTER (WHERE status IN ('waiting', 'in_consultation')) as active_tokens,
        COALESCE(SUM(fee_amount), 0) as total_volume
      FROM appointments
      WHERE created_at::date = CURRENT_DATE OR appointment_date = CURRENT_DATE::text
      GROUP BY clinic_id;
    `;

    // 4. Fetch bed telemetry
    const beds = await sql`
      SELECT 
        clinic_slug,
        COUNT(*) as total_beds,
        COUNT(*) FILTER (WHERE status = 'occupied') as occupied_beds
      FROM clinic_beds
      GROUP BY clinic_slug;
    `;

    // 5. Fetch all-time consultation counts
    const allTimeApts = await sql`
      SELECT 
        clinic_id,
        COUNT(*) as all_time_tokens,
        COALESCE(SUM(fee_amount), 0) as all_time_gmv
      FROM appointments
      GROUP BY clinic_id;
    `;

    // Plan pricing map in INR (Aligned with ClinicOS core SaaS thesis)
    const planRates: Record<string, { name: string; monthly: number }> = {
      solo: { name: "Solo Doctor Practice", monthly: 599 },
      starter: { name: "Solo Doctor Practice", monthly: 599 },
      polyclinic: { name: "Multi-Doctor Polyclinic", monthly: 1299 },
      growth: { name: "Multi-Doctor Polyclinic", monthly: 1299 },
      enterprise: { name: "Hospital Enterprise", monthly: 2999 },
      trial: { name: "14-Day Pilot Trial", monthly: 0 }
    };

    // Synthesize tenant metrics
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
      const planKey = (c.subscription_plan || "starter").toLowerCase();
      const planInfo = planRates[planKey] || planRates.starter;
      const status = (c.subscription_status || "active").toLowerCase();
      const clinicDoctors = doctors.filter((d: any) => 
        (d.clinic_id && String(d.clinic_id) === String(c.id)) || 
        (d.clinic_slug && d.clinic_slug.toLowerCase() === (c.slug || "").toLowerCase())
      );

      const aptToday = todayApts.find((a: any) => String(a.clinic_id) === String(c.id)) || {
        total_tokens: 0,
        completed_tokens: 0,
        active_tokens: 0,
        total_volume: 0
      };

      const aptAllTime = allTimeApts.find((a: any) => String(a.clinic_id) === String(c.id)) || {
        all_time_tokens: 0,
        all_time_gmv: 0
      };

      const bedData = beds.find((b: any) => b.clinic_slug && b.clinic_slug.toLowerCase() === (c.slug || "").toLowerCase()) || {
        total_beds: 0,
        occupied_beds: 0
      };

      // Status aggregation
      if (status === "active" || status === "paid") {
        totalPaidClinics++;
        totalNetworkMRR += planInfo.monthly;
      } else if (status === "trial") {
        totalTrialClinics++;
      } else if (status === "due" || status === "due_soon") {
        totalDueClinics++;
      } else if (status === "suspended") {
        totalSuspendedClinics++;
      }

      totalPlatformGMVToday += Number(aptToday.total_volume || 0);
      totalTokensToday += Number(aptToday.total_tokens || 0);
      totalBedsNetwork += Number(bedData.total_beds || 0);
      totalOccupiedBedsNetwork += Number(bedData.occupied_beds || 0);

      // Renewal date calculations
      const expiresAt = c.subscription_expires_at ? new Date(c.subscription_expires_at) : new Date(Date.now() + 21 * 24 * 3600 * 1000);
      const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        phone: c.phone || "+919876543210",
        city: c.city || "Dehradun",
        state: c.state || "Uttarakhand",
        address: c.address_line || "Dehradun Medical Hub",
        upi_vpa: c.upi_vpa || "clinic@upi",
        status: c.status || "active",
        subscription_plan: planKey,
        plan_name: planInfo.name,
        monthly_fee: planInfo.monthly,
        subscription_status: status,
        subscription_expires_at: expiresAt.toISOString(),
        days_remaining: daysRemaining,
        doctor_count: clinicDoctors.length,
        lead_doctor: clinicDoctors[0]?.full_name || "Primary Medical Officer",
        doctors: clinicDoctors,
        tokens_today: Number(aptToday.total_tokens || 0),
        active_tokens: Number(aptToday.active_tokens || 0),
        completed_tokens: Number(aptToday.completed_tokens || 0),
        gmv_today: Number(aptToday.total_volume || 0),
        all_time_tokens: Number(aptAllTime.all_time_tokens || 0),
        all_time_gmv: Number(aptAllTime.all_time_gmv || 0),
        total_beds: Number(bedData.total_beds || 0),
        occupied_beds: Number(bedData.occupied_beds || 0)
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
      platform_take_rate_revenue_est: Math.round(totalTokensToday * 10), // ₹10 convenience/tech charge per OPD ticket
      today_network_tokens: totalTokensToday,
      today_network_gmv: totalPlatformGMVToday,
      total_beds: totalBedsNetwork,
      occupied_beds: totalOccupiedBedsNetwork,
      network_bed_occupancy_pct: totalBedsNetwork > 0 ? Math.round((totalOccupiedBedsNetwork / totalBedsNetwork) * 100) : 0
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis,
      clinics: enrichedClinics
    });
  } catch (error: any) {
    console.error("Super Admin Master API error:", error);
    return NextResponse.json({ detail: error.message || "Failed to load master admin metrics" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      clinic_id, 
      clinic_slug, 
      action, 
      subscription_plan, 
      subscription_status, 
      extend_days 
    } = body;

    if (!clinic_id && !clinic_slug) {
      return NextResponse.json({ detail: "clinic_id or clinic_slug is required" }, { status: 400 });
    }

    if (action === "record_payment" || action === "renew") {
      const days = Number(extend_days || 30);
      const newExpiry = new Date(Date.now() + days * 24 * 3600 * 1000);

      const updated = clinic_id
        ? await sql`
            UPDATE clinics 
            SET 
              subscription_status = 'active',
              subscription_plan = COALESCE(${subscription_plan || null}, subscription_plan),
              subscription_expires_at = ${newExpiry},
              status = 'active'
            WHERE id::text = ${clinic_id}::text
            RETURNING *;
          `
        : await sql`
            UPDATE clinics 
            SET 
              subscription_status = 'active',
              subscription_plan = COALESCE(${subscription_plan || null}, subscription_plan),
              subscription_expires_at = ${newExpiry},
              status = 'active'
            WHERE lower(slug) = ${clinic_slug.toLowerCase()}
            RETURNING *;
          `;

      return NextResponse.json({ 
        success: true, 
        message: `SaaS subscription renewed successfully for ${days} days.`,
        clinic: updated[0] 
      });
    }

    if (action === "update_status") {
      const updated = clinic_id
        ? await sql`
            UPDATE clinics 
            SET 
              subscription_status = COALESCE(${subscription_status || null}, subscription_status),
              subscription_plan = COALESCE(${subscription_plan || null}, subscription_plan)
            WHERE id::text = ${clinic_id}::text
            RETURNING *;
          `
        : await sql`
            UPDATE clinics 
            SET 
              subscription_status = COALESCE(${subscription_status || null}, subscription_status),
              subscription_plan = COALESCE(${subscription_plan || null}, subscription_plan)
            WHERE lower(slug) = ${clinic_slug.toLowerCase()}
            RETURNING *;
          `;

      return NextResponse.json({ 
        success: true, 
        message: "Clinic status updated successfully.",
        clinic: updated[0] 
      });
    }

    if (action === "toggle_lock") {
      const { new_status } = body;
      const updated = clinic_id
        ? await sql`
            UPDATE clinics 
            SET status = ${new_status || 'active'}
            WHERE id::text = ${clinic_id}::text
            RETURNING *;
          `
        : await sql`
            UPDATE clinics 
            SET status = ${new_status || 'active'}
            WHERE lower(slug) = ${clinic_slug.toLowerCase()}
            RETURNING *;
          `;

      return NextResponse.json({ 
        success: true, 
        message: `Clinic access ${new_status === 'suspended' ? 'suspended' : 'activated'}.`,
        clinic: updated[0] 
      });
    }

    return NextResponse.json({ detail: "Unknown action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("Super Admin action error:", error);
    return NextResponse.json({ detail: error.message || "Failed to process super admin action" }, { status: 500 });
  }
}
