import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Generates a FHIR-shaped draft bundle from local clinic data for the ABDM
 * sandbox. No NHA gateway transmission is performed, and sandbox identifiers
 * are clearly tagged so they cannot be mistaken for a national ABHA.
 *
 * Only records belonging to the caller's clinic are exported, and the ABHA
 * identifier is read from the clinic's ABDM registry: it is never synthesised.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await guard(req, { roles: CLINIC_ROLES });
  if (!auth.ok) return auth.response;

  const clinicId = auth.auth.clinic!.id;
  const clinicSlug = auth.auth.clinic!.slug;

  try {
    const { id } = await params;

    const appts = await db`
      SELECT
        a.*,
        d.full_name AS doctor_full_name,
        d.specialization,
        d.medical_council_reg_number
      FROM appointments a
      LEFT JOIN doctors d
        ON d.slug = a.doctor_slug AND d.clinic_id = a.clinic_id
      WHERE (a.id::text = ${id} OR a.appointment_number = ${id})
        AND a.clinic_id::text = ${clinicId}::text
      LIMIT 1;
    `;

    if (appts.length === 0) {
      return apiError(
        404,
        "Record not found for ABDM FHIR export in your clinic.",
        "record_not_found"
      );
    }

    const appt = appts[0];

    // ABHA must come from the clinic's ABDM registry for this patient.
    const abdmRows = await db`
      SELECT abha_number, abha_address, kyc_status
      FROM abdm_patients
      WHERE clinic_slug = ${clinicSlug}
        AND patient_phone = ${appt.patient_phone}
        AND kyc_status IN ('VERIFIED', 'PENDING_NHA_SYNC')
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    if (abdmRows.length === 0) {
      return apiError(
        422,
        "This patient has no ABDM record linked in the clinic registry. Create or link a record before exporting a FHIR bundle.",
        "abha_not_linked"
      );
    }

    const abhaNumber = abdmRows[0].abha_number;
    const abhaAddress = abdmRows[0].abha_address || null;
    const isSandbox =
      abdmRows[0].kyc_status !== "VERIFIED" || String(abhaNumber).startsWith("SANDBOX-");
    const abhaSystem = isSandbox
      ? "https://clinicos.health/sandbox-abdm-identifier"
      : "https://healthid.ndhm.gov.in";
    const docReg = appt.medical_council_reg_number || null;
    const practitionerName =
      appt.doctor_name || appt.doctor_full_name || appt.doctor_slug || "Unknown practitioner";

    const practitionerIdentifier = docReg
      ? [
          {
            system: "https://clinicos.health/medical-council-registration",
            value: docReg,
          },
        ]
      : [];

    const fhirBundle = {
      resourceType: "Bundle",
      id: `abdm-bundle-${appt.appointment_number}`,
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString(),
        profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"],
        ...(isSandbox
          ? {
              tag: [
                {
                  system: "https://clinicos.health/fhir/sandbox",
                  code: "sandbox-abdm",
                  display: "Sandbox record — not transmitted to NHA",
                },
              ],
            }
          : {}),
      },
      identifier: {
        system: "https://clinicos.health/fhir/bundle",
        value: `BUNDLE-${appt.appointment_number}`,
      },
      type: "document",
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: `Composition/comp-${appt.appointment_number}`,
          resource: {
            resourceType: "Composition",
            id: `comp-${appt.appointment_number}`,
            status: "final",
            type: {
              coding: [
                {
                  system: "https://projecteka.in/snomed",
                  code: "440545006",
                  display: "Prescription record",
                },
              ],
              text: "Prescription record",
            },
            subject: {
              reference: `Patient/pat-${appt.id}`,
              display: appt.patient_name,
            },
            date: appt.created_at,
            author: [
              {
                reference: `Practitioner/doc-${appt.doctor_slug}`,
                display: practitionerName,
              },
            ],
            title: "Prescription & OPD Consultation Record",
            custodian: {
              reference: "Organization/org-clinicos-01",
              display: auth.auth.clinic!.name,
            },
          },
        },
        {
          fullUrl: `Patient/pat-${appt.id}`,
          resource: {
            resourceType: "Patient",
            id: `pat-${appt.id}`,
            identifier: [
              {
                type: {
                  coding: [
                    {
                      system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                      code: "MR",
                      display: "Medical record number",
                    },
                  ],
                },
                system: abhaSystem,
                value: abhaNumber,
              },
            ],
            name: [{ text: appt.patient_name }],
            telecom: [
              { system: "phone", value: appt.patient_phone },
              ...(abhaAddress ? [{ system: "other", value: abhaAddress }] : []),
            ],
          },
        },
        {
          fullUrl: `Practitioner/doc-${appt.doctor_slug}`,
          resource: {
            resourceType: "Practitioner",
            id: `doc-${appt.doctor_slug}`,
            identifier: practitionerIdentifier,
            name: [
              {
                text: practitionerName,
              },
            ],
          },
        },
        {
          fullUrl: `Condition/cond-${appt.id}`,
          resource: {
            resourceType: "Condition",
            id: `cond-${appt.id}`,
            code: {
              text: appt.symptoms_description || "Not recorded",
            },
            subject: {
              reference: `Patient/pat-${appt.id}`,
            },
          },
        },
      ],
    };

    return NextResponse.json(fhirBundle, {
      headers: {
        "X-ClinicOS-ABDM-Mode": isSandbox ? "sandbox" : "clinic-registry",
      },
    });
  } catch (error: any) {
    console.error("ABDM FHIR Export error:", error);
    return apiError(500, "Failed to generate ABDM FHIR bundle.", "internal_error");
  }
}
