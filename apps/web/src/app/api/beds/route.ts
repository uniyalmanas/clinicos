import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug") || "derma-care-dehradun";

    // 1. Fetch wards
    const wardsRows = await sql`
      SELECT * FROM clinic_wards 
      WHERE clinic_slug = ${clinicSlug} OR clinic_slug IS NULL
      ORDER BY name ASC;
    `;

    // 2. Fetch beds joined with ward
    const bedsRows = await sql`
      SELECT 
        b.id, b.clinic_slug, b.ward_id, b.bed_number, b.status,
        b.current_patient_name, b.current_patient_phone, b.assigned_doctor_name,
        b.admission_notes, b.admission_timestamp, b.created_at,
        w.name AS ward_name, w.ward_type, w.daily_rate, w.hourly_rate
      FROM clinic_beds b
      LEFT JOIN clinic_wards w ON w.id = b.ward_id
      WHERE b.clinic_slug = ${clinicSlug} OR b.clinic_slug IS NULL
      ORDER BY b.bed_number ASC;
    `;

    const now = new Date();

    const beds = bedsRows.map((b: any) => {
      let stayHours = 0;
      let accruedCharge = 0;
      const hourlyRate = Number(b.hourly_rate || 150);
      const dailyRate = Number(b.daily_rate || 1400);

      if (b.status === "occupied" && b.admission_timestamp) {
        const admittedAt = new Date(b.admission_timestamp);
        const diffMs = Math.max(0, now.getTime() - admittedAt.getTime());
        stayHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

        if (stayHours <= 12) {
          accruedCharge = Math.max(hourlyRate, Math.round(stayHours * hourlyRate));
        } else {
          const days = Math.ceil(stayHours / 24);
          accruedCharge = days * dailyRate;
        }
      }

      return {
        id: b.id,
        clinic_slug: b.clinic_slug || clinicSlug,
        ward_id: b.ward_id,
        ward_name: b.ward_name || "General Ward",
        ward_type: b.ward_type || "general",
        bed_number: b.bed_number,
        status: b.status,
        current_patient_name: b.current_patient_name,
        current_patient_phone: b.current_patient_phone,
        assigned_doctor_name: b.assigned_doctor_name,
        admission_notes: b.admission_notes,
        admission_timestamp: b.admission_timestamp,
        daily_rate: dailyRate,
        hourly_rate: hourlyRate,
        stay_hours: stayHours,
        accrued_charge: accruedCharge
      };
    });

    // Compute wards summary
    const wards = wardsRows.map((w: any) => {
      const wardBeds = beds.filter(b => b.ward_id === w.id);
      return {
        id: w.id,
        name: w.name,
        ward_type: w.ward_type,
        daily_rate: Number(w.daily_rate || 0),
        hourly_rate: Number(w.hourly_rate || 0),
        total_beds: wardBeds.length,
        occupied_beds: wardBeds.filter(b => b.status === "occupied").length
      };
    });

    // Compute metrics
    const totalBeds = beds.length;
    const occupiedCount = beds.filter(b => b.status === "occupied").length;
    const vacantCount = beds.filter(b => b.status === "vacant").length;
    const dischargePendingCount = beds.filter(b => b.status === "discharge_pending").length;
    const maintenanceCount = beds.filter(b => b.status === "maintenance").length;
    const occupancyRate = totalBeds > 0 ? parseFloat(((occupiedCount / totalBeds) * 100).toFixed(1)) : 0;
    const estDailyRev = beds.filter(b => b.status === "occupied").reduce((acc, curr) => acc + curr.daily_rate, 0);

    return NextResponse.json({
      beds,
      wards,
      metrics: {
        total_beds: totalBeds,
        occupied_count: occupiedCount,
        vacant_count: vacantCount,
        discharge_pending_count: dischargePendingCount,
        maintenance_count: maintenanceCount,
        occupancy_rate_percent: occupancyRate,
        estimated_daily_revenue: estDailyRev
      }
    });
  } catch (error: any) {
    console.error("GET /api/beds error:", error);
    return NextResponse.json({ error: error.message || "Failed to load beds" }, { status: 500 });
  }
}
