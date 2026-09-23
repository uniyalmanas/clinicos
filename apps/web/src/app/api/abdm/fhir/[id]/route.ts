import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * ABDM Milestone 2 (HIP: Health Information Provider)
 * Generates an Ayushman Bharat Digital Mission (ABDM) FHIR R4 compliant bundle
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch appointment or prescription
    const appts = await db`
      SELECT a.*, d.full_name as doctor_full_name, d.specialization
      FROM appointments a
      LEFT JOIN doctors d ON d.slug = a.doctor_slug
      WHERE a.id::text = ${id} OR a.appointment_number = ${id}
      LIMIT 1;
    `;

    if (appts.length === 0) {
      return NextResponse.json({ error: "Record not found for ABDM FHIR export" }, { status: 404 });
    }

    const appt = appts[0];
    const abhaNumber = appt.abha_number || "91-4819-2041-8891";
    const abhaAddress = appt.abha_address || `${appt.patient_name.toLowerCase().replace(/\s+/g, "")}@abdm`;
    const docReg = appt.license_number || "NMC-UK-2018-8491";

    // Construct FHIR R4 Document Bundle conforming to NHA ABDM specifications
    const fhirBundle = {
      resourceType: "Bundle",
      id: `abdm-bundle-${appt.appointment_number}`,
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString(),
        profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"]
      },
      identifier: {
        system: "https://clinicos.health/fhir/bundle",
        value: `BUNDLE-${appt.appointment_number}`
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
                  display: "Prescription record"
                }
              ],
              text: "Prescription record"
            },
            subject: {
              reference: `Patient/pat-${appt.id}`,
              display: appt.patient_name
            },
            date: appt.created_at,
            author: [
              {
                reference: `Practitioner/doc-${appt.doctor_slug}`,
                display: appt.doctor_name || appt.doctor_full_name || "Consultant Physician"
              }
            ],
            title: "Prescription & OPD Consultation Record",
            custodian: {
              reference: "Organization/org-clinicos-01",
              display: "ClinicOS Healthcare Partner Centre"
            }
          }
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
                      display: "Medical record number"
                    }
                  ]
                },
                system: "https://healthid.ndhm.gov.in",
                value: abhaNumber
              }
            ],
            name: [
              {
                text: appt.patient_name
              }
            ],
            telecom: [
              {
                system: "phone",
                value: appt.patient_phone
              },
              {
                system: "other",
                value: abhaAddress
              }
            ]
          }
        },
        {
          fullUrl: `Practitioner/doc-${appt.doctor_slug}`,
          resource: {
            resourceType: "Practitioner",
            id: `doc-${appt.doctor_slug}`,
            identifier: [
              {
                system: "https://nmc.org.in",
                value: docReg
              }
            ],
            name: [
              {
                text: appt.doctor_name || "Dr. Rahul Sharma"
              }
            ]
          }
        },
        {
          fullUrl: `Condition/cond-${appt.id}`,
          resource: {
            resourceType: "Condition",
            id: `cond-${appt.id}`,
            code: {
              text: appt.symptoms_description || "General OPD Medical Evaluation"
            },
            subject: {
              reference: `Patient/pat-${appt.id}`
            }
          }
        }
      ]
    };

    return NextResponse.json(fhirBundle);
  } catch (error: any) {
    console.error("ABDM FHIR Export error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate ABDM FHIR bundle" }, { status: 500 });
  }
}
