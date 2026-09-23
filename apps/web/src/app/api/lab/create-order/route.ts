import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      patient_name, 
      patient_phone, 
      doctor_name, 
      test_name, 
      category, 
      sample_type, 
      fasting_required 
    } = body;

    if (!patient_name || !patient_phone || !test_name) {
      return NextResponse.json({ error: "patient_name, patient_phone, and test_name are required" }, { status: 400 });
    }

    const orderNumber = `LAB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const inserted = await db`
      INSERT INTO diagnostic_lab_orders (
        order_number,
        patient_name,
        patient_phone,
        doctor_name,
        test_name,
        category,
        sample_type,
        fasting_required,
        status
      ) VALUES (
        ${orderNumber},
        ${patient_name},
        ${patient_phone},
        ${doctor_name || "Self-Referred / OPD Walk-in"},
        ${test_name},
        ${category || "Biochemistry"},
        ${sample_type || "Venous Blood (Serum)"},
        ${Boolean(fasting_required)},
        'ordered'
      )
      RETURNING *;
    `;

    return NextResponse.json({ success: true, order: inserted[0] });
  } catch (error: any) {
    console.error("Create lab order error:", error);
    return NextResponse.json({ error: error.message || "Failed to create lab order" }, { status: 500 });
  }
}
