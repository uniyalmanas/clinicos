import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let claims;
    if (status && status !== "all") {
      claims = await db`
        SELECT c.*, b.bed_number 
        FROM insurance_claims c
        LEFT JOIN clinic_beds b ON b.id::text = c.bed_id::text
        WHERE c.status = ${status}
        ORDER BY c.created_at DESC;
      `;
    } else {
      claims = await db`
        SELECT c.*, b.bed_number 
        FROM insurance_claims c
        LEFT JOIN clinic_beds b ON b.id::text = c.bed_id::text
        ORDER BY c.created_at DESC;
      `;
    }

    const counts = await db`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pre_auth_submitted') as pre_auth_count,
        COUNT(*) FILTER (WHERE status = 'query_raised') as query_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'settled') as settled_count,
        COALESCE(SUM(approved_amount), 0) as total_approved_amount
      FROM insurance_claims;
    `;

    return NextResponse.json({
      claims,
      metrics: {
        total: parseInt(counts[0].total) || 0,
        pre_auth: parseInt(counts[0].pre_auth_count) || 0,
        query_raised: parseInt(counts[0].query_count) || 0,
        approved: parseInt(counts[0].approved_count) || 0,
        settled: parseInt(counts[0].settled_count) || 0,
        total_approved_amount: parseFloat(counts[0].total_approved_amount) || 0
      }
    });
  } catch (error: any) {
    console.error("Fetch insurance claims error:", error);
    return NextResponse.json({ error: error.message || "Failed to load insurance claims" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patient_name,
      patient_phone,
      policy_number,
      tpa_company,
      bed_id,
      estimated_amount,
      remarks
    } = body;

    if (!patient_name || !patient_phone || !policy_number || !tpa_company) {
      return NextResponse.json({ error: "patient_name, patient_phone, policy_number, and tpa_company are required" }, { status: 400 });
    }

    const claimNumber = `CLM-${new Date().getFullYear()}-${tpa_company.split(" ")[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const inserted = await db`
      INSERT INTO insurance_claims (
        claim_number,
        patient_name,
        patient_phone,
        policy_number,
        tpa_company,
        bed_id,
        estimated_amount,
        approved_amount,
        status,
        remarks
      ) VALUES (
        ${claimNumber},
        ${patient_name},
        ${patient_phone},
        ${policy_number},
        ${tpa_company},
        ${bed_id || null},
        ${parseFloat(estimated_amount) || 0},
        0,
        'pre_auth_submitted',
        ${remarks || "Initial pre-authorization cashless claim request submitted."}
      ) RETURNING *;
    `;

    return NextResponse.json({ success: true, claim: inserted[0] });
  } catch (error: any) {
    console.error("Create insurance claim error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit insurance claim" }, { status: 500 });
  }
}
