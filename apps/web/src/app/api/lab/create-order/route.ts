import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      patient_name, 
      patient_phone, 
      patient_age = 35,
      patient_gender = "male",
      doctor_name, 
      test_name, 
      category, 
      sample_type, 
      fasting_required,
      vacutainer_tube,
      tat_sla_minutes
    } = body;

    if (!patient_name || !patient_phone || !test_name) {
      return NextResponse.json({ error: "patient_name, patient_phone, and test_name are required" }, { status: 400 });
    }

    const orderNumber = `LAB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let tube = vacutainer_tube;
    if (!tube) {
      const lower = test_name.toLowerCase();
      if (lower.includes("cbc") || lower.includes("blood count") || lower.includes("hba1c")) {
        tube = "Lavender (K2-EDTA)";
      } else if (lower.includes("glucose") || lower.includes("sugar")) {
        tube = "Grey (Sodium Fluoride)";
      } else if (lower.includes("pt") || lower.includes("inr") || lower.includes("coagulation")) {
        tube = "Light Blue (Sodium Citrate)";
      } else {
        tube = "Gold (SST Gel Clot Activator)";
      }
    }

    const tubeSuffix = tube.includes("EDTA") ? "EDTA" : tube.includes("Fluoride") ? "GLU" : "SST";
    const sampleBarcode = `BC-${Math.floor(100000 + Math.random() * 900000)}-${tubeSuffix}`;
    const sla = Number(tat_sla_minutes || (category === "Hematology" ? 90 : 180));

    const inserted = await db`
      INSERT INTO diagnostic_lab_orders (
        order_number,
        sample_barcode,
        patient_name,
        patient_phone,
        patient_age,
        patient_gender,
        doctor_name,
        test_name,
        category,
        sample_type,
        vacutainer_tube,
        fasting_required,
        tat_sla_minutes,
        status
      ) VALUES (
        ${orderNumber},
        ${sampleBarcode},
        ${patient_name},
        ${patient_phone},
        ${Number(patient_age)},
        ${patient_gender},
        ${doctor_name || "Self-Referred / OPD Walk-in"},
        ${test_name},
        ${category || "Biochemistry"},
        ${sample_type || "Venous Blood (Serum)"},
        ${tube},
        ${Boolean(fasting_required)},
        ${sla},
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
