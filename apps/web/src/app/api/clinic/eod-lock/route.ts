import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { authorizeClinicUser } from "@/lib/auth";
import { createHash, randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 🔐 Auth Guard — only clinic_admin and owner can lock EOD financials
    let auth;
    try {
      auth = await authorizeClinicUser(req, {
        requiredRoles: ["owner", "clinic_admin", "superadmin"],
      });
    } catch (authErr: any) {
      return NextResponse.json(
        { error: "Unauthorized: Only clinic owners or admins can lock end-of-day.", detail: authErr.message },
        { status: authErr.status || 401 }
      );
    }

    const body = await req.json();
    const {
      counted_cash = 0,
      closing_notes = "Day closed and reconciled",
    } = body;

    // ✅ Resolve clinic_slug from authenticated session — NOT from user input
    const clinic_slug = auth.clinic.slug;
    const closed_by = auth.user.full_name;

    const todayStr = new Date().toISOString().split("T")[0];

    // Gather metrics for audit payload (scoped to authenticated clinic)
    const apts = await sql`
      SELECT * FROM appointments 
      WHERE clinic_id = ${auth.clinic.id}::uuid
        AND (appointment_date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;

    const totalConsultations = apts.length;
    const gross = apts
      .filter((a: any) => a.payment_status === "paid")
      .reduce((acc: number, curr: any) => acc + Number(curr.fee_amount || 0), 0);
    const upi = apts
      .filter((a: any) => a.payment_status === "paid" && (a.payment_mode === "upi" || a.payment_mode === "online_upi"))
      .reduce((acc: number, curr: any) => acc + Number(curr.fee_amount || 0), 0);
    const cash = gross - upi;

    const hashPayload = `${clinic_slug}|${todayStr}|${totalConsultations}|${gross}|${counted_cash}|${closed_by}|${auth.user.id}|${Date.now()}`;
    const auditHash = `EOD-SEAL-${createHash("sha256").update(hashPayload).digest("hex").slice(0, 10).toUpperCase()}`;

    const id = randomUUID();

    const inserted = await sql`
      INSERT INTO clinic_eod_closings (
        id, clinic_id, clinic_slug, closing_date, closed_by,
        total_appointments, total_gross_revenue, upi_revenue, cash_revenue,
        actual_cash_deposited, cash_variance, status, audit_hash, created_at
      ) VALUES (
        ${id},
        ${auth.clinic.id}::uuid,
        ${clinic_slug},
        ${todayStr},
        ${closed_by},
        ${totalConsultations},
        ${gross},
        ${upi},
        ${cash},
        ${Number(counted_cash)},
        ${Number(counted_cash) - cash},
        'LOCKED',
        ${auditHash},
        NOW()
      )
      ON CONFLICT (clinic_slug, closing_date) DO UPDATE
        SET audit_hash = EXCLUDED.audit_hash,
            total_appointments = EXCLUDED.total_appointments,
            total_gross_revenue = EXCLUDED.total_gross_revenue,
            status = 'LOCKED',
            closed_by = EXCLUDED.closed_by
      RETURNING *;
    `;

    return NextResponse.json({
      status: "success",
      locked_by: closed_by,
      clinic: clinic_slug,
      record: inserted[0] || { audit_hash: auditHash },
      audit_hash: auditHash,
      summary: {
        total_consultations: totalConsultations,
        gross_revenue: gross,
        upi_revenue: upi,
        cash_revenue: cash,
        counted_cash: Number(counted_cash),
        variance: Number(counted_cash) - cash,
      },
    });
  } catch (error: any) {
    console.error("POST /api/clinic/eod-lock error:", error);
    return NextResponse.json({ error: error.message || "Failed to lock day audit" }, { status: 500 });
  }
}
