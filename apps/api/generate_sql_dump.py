"""
Generate standalone clean_and_seed_supabase.sql
Generates standard PostgreSQL DDL and INSERT statements so the user can
paste it directly into Supabase Dashboard -> SQL Editor!
"""
import os
import sys
import json
from pathlib import Path
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import postgresql

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import Base, SessionLocal
from app.db.models import (
    Doctor, Clinic, Appointment, Prescription, PatientDocument, Review,
    Expense, ClinicWard, ClinicBed, PharmacyItem, PharmacyDispense,
    MarketplaceInquiry, PartnerApplication, ClinicEodClosing
)

output_sql_path = Path(__file__).resolve().parent / "clean_and_seed_supabase.sql"

def escape_val(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (dict, list)):
        serialized = json.dumps(v).replace("'", "''")
        return f"'{serialized}'::json"
    s = str(v).replace("'", "''")
    return f"'{s}'"

def main():
    lines = []
    lines.append("-- ==========================================================================")
    lines.append("-- ClinicOS / DocSphere: Complete Clean & Seed Migration for Supabase")
    lines.append("-- Target Project: ClinicFlow (jkixowmebpxwadnuxeil)")
    lines.append("-- Paste this entire script into Supabase SQL Editor and click 'RUN'")
    lines.append("-- ==========================================================================\n")

    lines.append("-- STEP 1: Wipe all old tables, views, triggers from the previous project")
    lines.append("DROP SCHEMA public CASCADE;")
    lines.append("CREATE SCHEMA public;\n")

    lines.append("-- STEP 2: Grant standard permissions to Supabase roles")
    lines.append("GRANT ALL ON SCHEMA public TO postgres;")
    lines.append("GRANT ALL ON SCHEMA public TO anon;")
    lines.append("GRANT ALL ON SCHEMA public TO authenticated;")
    lines.append("GRANT ALL ON SCHEMA public TO service_role;\n")

    lines.append("-- STEP 3: Create Tables")
    models = [
        Doctor, Clinic, Appointment, Prescription, PatientDocument, Review,
        Expense, ClinicWard, ClinicBed, PharmacyItem, PharmacyDispense,
        MarketplaceInquiry, PartnerApplication, ClinicEodClosing
    ]

    for model in models:
        ddl = str(CreateTable(model.__table__).compile(dialect=postgresql.dialect())).strip()
        lines.append(f"{ddl};\n")
        # Create indexes if table has indexed columns
        for col in model.__table__.columns:
            if col.index and not col.primary_key:
                idx_name = f"ix_{model.__tablename__}_{col.name}"
                lines.append(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {model.__tablename__} ({col.name});")
        lines.append("")

    lines.append("-- STEP 4: Seed Verified Clinics, Doctors, Beds & Records")
    db = SessionLocal()
    try:
        for model in models:
            records = db.query(model).all()
            if not records:
                continue
            lines.append(f"-- Seeding {model.__tablename__} ({len(records)} rows)")
            col_names = [c.name for c in model.__table__.columns]
            for r in records:
                vals = [escape_val(getattr(r, c)) for c in col_names]
                cols_str = ", ".join(col_names)
                vals_str = ", ".join(vals)
                lines.append(f"INSERT INTO {model.__tablename__} ({cols_str}) VALUES ({vals_str}) ON CONFLICT DO NOTHING;")
            lines.append("")
    finally:
        db.close()

    lines.append("-- Verification summary")
    lines.append("SELECT 'Doctors Count' AS metric, COUNT(*) FROM doctors")
    lines.append("UNION ALL")
    lines.append("SELECT 'Clinics Count' AS metric, COUNT(*) FROM clinics;")

    with open(output_sql_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Generated {output_sql_path} successfully ({len(lines)} lines).")

if __name__ == "__main__":
    main()
