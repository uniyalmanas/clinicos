"""
DocSphere / ClinicOS - Supabase Reset & Database Initializer
Run this script to clean out all old data from previous projects in Supabase
and initialize all ClinicOS / DocSphere tables and verified seeds.

Usage:
  python setup_supabase.py "<DATABASE_URL>"
  OR
  python setup_supabase.py (reads DATABASE_URL from apps/api/.env)
"""

import os
import sys
from pathlib import Path
from urllib.parse import parse_qsl, quote, urlencode, urlsplit, urlunsplit

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add apps/api to sys.path
api_dir = Path(__file__).resolve().parent
sys.path.append(str(api_dir))

# Ensure .env is loaded
env_file = api_dir / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file, override=True)
else:
    load_dotenv(override=True)

def normalize_database_url(raw_url: str) -> str:
    if not raw_url:
        return raw_url

    url = raw_url.strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    parsed_url = urlsplit(url)
    query_params = [
        (key, value) for key, value in parse_qsl(parsed_url.query, keep_blank_values=True)
        if key.lower() != "pgbouncer"
    ]

    encoded_user = quote(parsed_url.username or "", safe="")
    encoded_password = quote(parsed_url.password or "", safe="")
    encoded_host = parsed_url.hostname or ""
    if ":" in encoded_host and not encoded_host.startswith("["):
        encoded_host = f"[{encoded_host}]"
    if parsed_url.port:
        encoded_host = f"{encoded_host}:{parsed_url.port}"

    encoded_netloc = encoded_user
    if parsed_url.password is not None:
        encoded_netloc = f"{encoded_netloc}:{encoded_password}"
    encoded_netloc = f"{encoded_netloc}@{encoded_host}"

    return urlunsplit(parsed_url._replace(
        netloc=encoded_netloc,
        query=urlencode(query_params)
    ))


def get_database_url():
    # 1. Check command-line argument
    if len(sys.argv) > 1 and sys.argv[1].strip():
        return normalize_database_url(sys.argv[1].strip())

    # 2. Check environment variable
    env_url = os.getenv("DATABASE_URL", "").strip()
    if env_url:
        return normalize_database_url(env_url)

    return None

def reset_supabase_database():
    db_url = get_database_url()

    if not db_url:
        print("[!] Error: No DATABASE_URL provided.")
        print("\nPlease run this script with your Supabase connection string:")
        print('  python setup_supabase.py "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"')
        print("\nOr add DATABASE_URL to apps/api/.env first.")
        sys.exit(1)

    # Normalize postgres:// to postgresql:// for SQLAlchemy
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    # Automatically save / update apps/api/.env if provided as CLI arg
    if len(sys.argv) > 1 and sys.argv[1].strip():
        print(f"[+] Writing DATABASE_URL to {env_file}...")
        existing_lines = []
        if env_file.exists():
            with open(env_file, "r", encoding="utf-8") as f:
                existing_lines = [l for l in f.readlines() if not l.strip().startswith("DATABASE_URL=")]
        with open(env_file, "w", encoding="utf-8") as f:
            f.write(f"DATABASE_URL={db_url}\n")
            f.writelines(existing_lines)
        print("[+] apps/api/.env updated successfully!")

    print("\n" + "=" * 55)
    print("  ClinicOS / DocSphere Supabase Initializer")
    print("=" * 55)
    print("[*] Connecting to Supabase PostgreSQL database...")
    
    try:
        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            print("[*] Cleaning out all old tables from 'ClinicFlow' (Wiping public schema)...")
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO anon;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO authenticated;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO service_role;"))
            conn.commit()
            print("[+] All old tables, triggers, and foreign keys dropped cleanly!")
    except Exception as e:
        print(f"[!] Database connection failed: {e}")
        print("\nPlease check your Supabase connection string and password.")
        sys.exit(1)

    # Import models and init_database
    from app.db.session import Base
    from app.db.models import Doctor, Clinic, Appointment
    from app.db.init_db import init_database

    print("\n[*] Creating fresh ClinicOS tables in Supabase...")
    Base.metadata.create_all(bind=engine)
    print("[+] All ClinicOS tables (doctors, clinics, appointments, prescriptions, beds, pharmacy, etc.) created!")

    print("\n[*] Seeding verified Dehradun doctors, clinics, and initial records...")
    CustomSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    init_database(custom_engine=engine, custom_session_factory=CustomSession)
    
    # Verification query
    with CustomSession() as verify_session:
        doc_count = verify_session.query(Doctor).count()
        clinic_count = verify_session.query(Clinic).count()
        appt_count = verify_session.query(Appointment).count()
        print(f"\n[=] Verification:")
        print(f"   * Verified Doctors in Supabase: {doc_count}")
        print(f"   * Verified Clinics in Supabase: {clinic_count}")
        print(f"   * Sample Appointments in Supabase: {appt_count}")

    print("\n" + "=" * 55)
    print("[+] SUCCESS! Supabase project 'ClinicFlow' is 100% clean and fully initialized!")
    print("[+] You can now run the app or make bookings, and they will persist directly in Supabase.")
    print("=" * 55 + "\n")

if __name__ == "__main__":
    reset_supabase_database()
