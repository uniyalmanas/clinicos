from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DoctorReportSchema(BaseModel):
    title: str = "Clinical Consultation Summary"
    patient_name: str
    patient_uhid: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    doctor_name: str
    consultation_date: str
    chief_complaint: str
    history_of_present_illness: str
    relevant_medical_history: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    vitals: Dict[str, Any] = Field(default_factory=dict)
    examination_findings: List[str] = Field(default_factory=list)
    doctor_confirmed_assessment: str
    differential_diagnoses: List[str] = Field(default_factory=list)
    investigations_ordered: List[str] = Field(default_factory=list)
    treatment_plan: List[str] = Field(default_factory=list)
    prescriptions: List[Dict[str, Any]] = Field(default_factory=list)
    follow_up_instructions: str
    red_flag_warnings: List[str] = Field(default_factory=list)
    source_references: List[str] = Field(default_factory=list)


class PatientReportSchema(BaseModel):
    title: str = "Your Visit Summary & Care Plan"
    patient_name: str
    doctor_name: str
    visit_date: str
    reason_for_visit: str
    summary_of_discussion: str
    confirmed_findings: str
    diagnosis_explained: str
    medications: List[Dict[str, Any]] = Field(default_factory=list)
    tests_and_next_steps: List[str] = Field(default_factory=list)
    when_to_seek_urgent_care: List[str] = Field(default_factory=list)
    lifestyle_and_home_advice: List[str] = Field(default_factory=list)


class ReportApprovalRequest(BaseModel):
    approved_by_name: str
    doctor_report_edits: Optional[Dict[str, Any]] = None
    patient_report_edits: Optional[Dict[str, Any]] = None


class ConsultationReportsResponse(BaseModel):
    id: str
    session_id: Optional[str] = None
    patient_name: str
    patient_phone: str
    doctor_name: str
    status: str
    doctor_report: Dict[str, Any]
    patient_report: Dict[str, Any]
    transcript: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
