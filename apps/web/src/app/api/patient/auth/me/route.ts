import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guardPatient } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await guardPatient(req);
  if (!auth.ok) return auth.response;

  const phone = auth.auth.phone;

  const patients = await sql`
    SELECT uhid, full_name, phone, age, gender, blood_group
    FROM emr_patients
    WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = ${phone}
    LIMIT 1;
  `;

  const consents = await sql`
    SELECT purpose, granted, granted_at, revoked_at
    FROM patient_consents
    WHERE phone = ${phone}
    ORDER BY created_at DESC;
  `;

  return NextResponse.json({
    patient: patients[0]
      ? {
          uhid: patients[0].uhid,
          full_name: patients[0].full_name,
          phone,
          age: patients[0].age,
          gender: patients[0].gender,
          blood_group: patients[0].blood_group,
        }
      : { full_name: null, phone, uhid: null },
    consents,
  });
}
