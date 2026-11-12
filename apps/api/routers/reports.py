from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from apps.api.database import get_db
from apps.api.core.security import get_current_user
from apps.api.models.consultation import ConsultationSession, TranscriptTurn, ClinicalFact
from apps.api.models.report import ConsultationReport
from apps.api.models.companion import ClinicalAuditEvent
from apps.api.schemas.report import ReportApprovalRequest
from apps.api.workflows.graph import consultation_graph
from apps.api.services.patient_context import patient_context_service

router = APIRouter(prefix="/api/consultations", tags=["reports"])


@router.post("/sessions/{id}/generate-reports")
def generate_consultation_reports(
    id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    session = db.query(ConsultationSession).filter(ConsultationSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Consultation session not found.")

    turns = db.query(TranscriptTurn).filter(TranscriptTurn.consultation_id == id).order_by(TranscriptTurn.turn_index.asc()).all()
    full_tx = "\n".join([f"{t.speaker}: {t.transcript_text}" for t in turns])

    facts = db.query(ClinicalFact).filter(ClinicalFact.consultation_id == id).all()
    facts_list = [
        {"category": f.category, "fact_key": f.fact_key, "fact_value": f.fact_value, "status": f.status, "exact_quote": (f.sources[0].exact_quote if f.sources else None)}
        for f in facts
    ]

    verified_context = patient_context_service.get_verified_patient_records(
        db, session.patient_phone, str(session.clinic_id)
    )

    # Invoke LangGraph Workflow C
    graph_state = {
        "session_id": str(session.id),
        "clinic_id": str(session.clinic_id),
        "patient_phone": session.patient_phone,
        "patient_name": session.patient_name,
        "patient_uhid": session.patient_uhid,
        "doctor_name": session.doctor_name,
        "action": "generate_reports",
        "full_transcript": full_tx,
        "transcript_turns": [{"speaker": t.speaker, "transcript_text": t.transcript_text} for t in turns],
        "clinical_facts": facts_list,
        "verified_patient_records": verified_context,
    }

    result = consultation_graph.invoke(
        graph_state,
        config={"configurable": {"thread_id": str(session.id)}},
    )

    doc_report = result.get("doctor_report") or {}
    pat_report = result.get("patient_report") or {}

    # Store or update in consultation_reports table
    report_record = db.query(ConsultationReport).filter(ConsultationReport.session_id == session.id).first()
    if not report_record:
        report_record = ConsultationReport(
            clinic_id=session.clinic_id,
            session_id=session.id,
            patient_phone=session.patient_phone,
            patient_name=session.patient_name,
            doctor_slug=session.doctor_slug,
            doctor_name=session.doctor_name,
            transcript=full_tx,
            chief_complaints=doc_report.get("chief_complaint", ""),
            provisional_diagnosis=doc_report.get("doctor_confirmed_assessment", ""),
            vitals=doc_report.get("vitals", {}),
            medicines=doc_report.get("prescriptions", []),
            doctor_report=doc_report,
            patient_report=pat_report,
            status="draft",
        )
        db.add(report_record)
    else:
        report_record.transcript = full_tx
        report_record.chief_complaints = doc_report.get("chief_complaint", "")
        report_record.provisional_diagnosis = doc_report.get("doctor_confirmed_assessment", "")
        report_record.vitals = doc_report.get("vitals", {})
        report_record.medicines = doc_report.get("prescriptions", [])
        report_record.doctor_report = doc_report
        report_record.patient_report = pat_report
        report_record.status = "draft"

    db.commit()
    db.refresh(report_record)

    return {
        "status": "success",
        "report_id": str(report_record.id),
        "doctor_report": doc_report,
        "patient_report": pat_report,
    }


@router.get("/sessions/{id}/reports")
def get_consultation_reports(
    id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    report_record = db.query(ConsultationReport).filter(ConsultationReport.session_id == id).first()
    if not report_record:
        raise HTTPException(status_code=404, detail="No reports generated yet for this session.")

    return {
        "id": str(report_record.id),
        "session_id": str(report_record.session_id),
        "status": report_record.status,
        "doctor_report": report_record.doctor_report,
        "patient_report": report_record.patient_report,
        "approved_by": str(report_record.approved_by) if report_record.approved_by else None,
        "approved_at": report_record.approved_at,
    }


@router.put("/sessions/{id}/reports")
def update_consultation_reports(
    id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    report_record = db.query(ConsultationReport).filter(ConsultationReport.session_id == id).first()
    if not report_record:
        raise HTTPException(status_code=404, detail="Reports not found.")

    if "doctor_report" in payload:
        report_record.doctor_report = payload["doctor_report"]
    if "patient_report" in payload:
        report_record.patient_report = payload["patient_report"]

    db.commit()
    return {"status": "success", "message": "Draft reports updated."}


@router.post("/sessions/{id}/reports/approve")
def approve_consultation_reports(
    id: str,
    payload: ReportApprovalRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    session = db.query(ConsultationSession).filter(ConsultationSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Consultation session not found.")

    report_record = db.query(ConsultationReport).filter(ConsultationReport.session_id == id).first()
    if not report_record:
        raise HTTPException(status_code=404, detail="No report found to approve.")

    if payload.doctor_report_edits:
        report_record.doctor_report = payload.doctor_report_edits
    if payload.patient_report_edits:
        report_record.patient_report = payload.patient_report_edits

    now = datetime.now(timezone.utc)
    report_record.status = "approved"
    report_record.approved_at = now
    session.status = "finalized"
    session.finalized_at = now

    # Log audit event
    audit = ClinicalAuditEvent(
        consultation_id=session.id,
        clinic_id=session.clinic_id,
        actor_name=payload.approved_by_name or session.doctor_name,
        action="report_approved",
        details={"report_id": str(report_record.id), "approved_at": now.isoformat()},
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": "Consultation finalized and clinical reports approved.",
        "report_id": str(report_record.id),
        "status_code": "approved",
    }


@router.get("/sessions/{id}/reports/export", response_class=HTMLResponse)
def export_printable_reports(
    id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    report_record = db.query(ConsultationReport).filter(ConsultationReport.session_id == id).first()
    if not report_record:
        raise HTTPException(status_code=404, detail="Reports not found.")

    doc = report_record.doctor_report or {}
    pat = report_record.patient_report or {}

    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ClinicOS Consultation Report - {report_record.patient_name}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; }}
        .header {{ border-bottom: 2px solid #0071E3; padding-bottom: 12px; margin-bottom: 24px; }}
        h1 {{ margin: 0; color: #0f172a; font-size: 24px; }}
        h2 {{ color: #0071E3; font-size: 18px; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }}
        .meta-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; font-size: 14px; background: #f8fafc; padding: 16px; border-radius: 8px; }}
        .badge {{ display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }}
        .badge-approved {{ background: #dcfce7; color: #15803d; }}
        .section-box {{ background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }}
        ul {{ padding-left: 20px; }}
        .footer {{ font-size: 12px; color: #64748b; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>ClinicOS Clinical Consultation & Care Plan</h1>
        <div>Consultation ID: {id} | Status: <span class="badge badge-approved">{report_record.status.upper()}</span></div>
    </div>

    <div class="meta-grid">
        <div><strong>Patient:</strong> {report_record.patient_name}</div>
        <div><strong>Doctor:</strong> {report_record.doctor_name}</div>
        <div><strong>Date:</strong> {doc.get('consultation_date', datetime.now().strftime('%d %b %Y'))}</div>
        <div><strong>Phone:</strong> {report_record.patient_phone}</div>
    </div>

    <h2>1. Doctor Clinical Report</h2>
    <div class="section-box">
        <p><strong>Chief Complaint:</strong> {doc.get('chief_complaint', 'N/A')}</p>
        <p><strong>Assessment:</strong> {doc.get('doctor_confirmed_assessment', 'N/A')}</p>
        <p><strong>History of Present Illness:</strong> {doc.get('history_of_present_illness', 'N/A')}</p>
        <p><strong>Treatment Plan:</strong></p>
        <ul>
            {''.join([f"<li>{item}</li>" for item in doc.get('treatment_plan', [])])}
        </ul>
        <p><strong>Follow-Up:</strong> {doc.get('follow_up_instructions', 'N/A')}</p>
    </div>

    <h2>2. Patient Care Summary</h2>
    <div class="section-box">
        <p><strong>Reason for Visit:</strong> {pat.get('reason_for_visit', 'N/A')}</p>
        <p><strong>What was discussed:</strong> {pat.get('summary_of_discussion', 'N/A')}</p>
        <p><strong>Diagnosis Explained:</strong> {pat.get('diagnosis_explained', 'N/A')}</p>
        <p><strong>Home Care Advice:</strong></p>
        <ul>
            {''.join([f"<li>{item}</li>" for item in pat.get('lifestyle_and_home_advice', [])])}
        </ul>
        <p><strong>When to seek urgent care:</strong></p>
        <ul>
            {''.join([f"<li>{item}</li>" for item in pat.get('when_to_seek_urgent_care', [])])}
        </ul>
    </div>

    <div class="footer">
        Generated by ClinicOS AI Clinical Companion • Approved by Clinician • Valid for Clinical Record
    </div>
</body>
</html>"""

    return HTMLResponse(content=html_content)
