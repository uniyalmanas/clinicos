# ClinicOS 🩺
### Ultra-Fast OPD Operating System for Independent Indian Clinics & Doctors

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(Local)-003B57?style=flat-square&logo=sqlite)](https://sqlite.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🎯 The Reality of an Indian OPD Clinic

An Indian OPD doctor between 6:00 PM and 8:30 PM is not an IT executive clicking nested menus—they are in a high-pressure environment seeing 40 to 60 patients in 3 hours. 

- On a physical paper pad, scribbling a prescription takes **15 to 20 seconds**.
- If software takes **45 seconds** (dropdown searches, dosage pickers, multi-step wizards), the doctor loses **30 seconds per patient**. Across 50 patients, that is **25 extra minutes** of screen time while exhausted.
- **The Rule:** If software is slower than paper, the doctor abandons it by patient #5 and picks up their pen.

**ClinicOS is built strictly around the 5 tools busy clinics actually pay for:**
1. **Speed Prescribing (< 15s):** Repeat Last Rx, custom combos, vitals quick-pad, and letterhead calibration.
2. **Reception Token Desk:** Walk-in token generator with instant acoustic chime bell and Cash vs. Soundbox UPI tallies.
3. **Waiting Room Smart TV Display:** Zero-setup fullscreen queue board with bilingual voice announcements.
4. **9:00 PM Day-Closing Cockpit:** Real SQLite aggregation of today's tokens, physical cash drawer balance, and visiting specialist fee splits.
5. **Front Desk Acrylic Standee Studio:** Print-ready clinic QR standee for live token tracking and Google reviews.

---

## 🛠️ The Core 5 Clinic Modules

```
 ┌───────────────────────────┐      ┌───────────────────────────┐
 │ 1. Reception Counter Desk │─────►│ 2. Waiting Room Smart TV  │
 │ • Walk-in tokens          │      │ • Fullscreen browser TV   │
 │ • Cash vs Soundbox UPI    │      │ • Bilingual audio chime   │
 └─────────────┬─────────────┘      └───────────────────────────┘
               │
               ▼
 ┌───────────────────────────┐      ┌───────────────────────────┐
 │ 3. Speed Consultation Pad │─────►│ 4. Direct WhatsApp & Print│
 │ • Repeat Last Rx (1 tap)  │      │ • Pre-printed letterhead  │
 │ • Saved doctor combos     │      │ • 1-tap wa.me link share  │
 └─────────────┬─────────────┘      └───────────────────────────┘
               │
               ▼
 ┌───────────────────────────┐      ┌───────────────────────────┐
 │ 5. 9:00 PM Day Closing    │─────►│ 6. Owner WhatsApp Audit   │
 │ • Real SQLite token sums  │      │ • 0 manual Excel sheets   │
 │ • Cash drawer settlement  │      │ • CA-ready audit ledger   │
 └───────────────────────────┘      └───────────────────────────┘
```

---

### 1. ⚡ Ultra-Fast OPD Prescription Pad
*Location:* [`apps/web/src/app/dashboard/consult/[id]/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/dashboard/consult/%5Bid%5D/page.tsx)

- **🔁 Repeat Last Rx & Extend 30 Days (1 Tap):** When a returning patient visits, ClinicOS detects their clinical encounter history. Doctors clone the exact medications in one tap or extend chronic refills by 30 days. Copies stored items only—never invents or falls back to random drugs.
- **🩺 Vitals Quick-Pad:** Fast numeric keypad inputs for BP (`120/80`), Pulse, Body Temp (°F), SpO2 (%), RBS Sugar, and auto-calculated BMI with instant diagnostic badges.
- **⚡ 1-Tap Doctor Rx Combos ("Save as My Combo"):** Instant clinical packs for Dermatology, General Practice, Pediatrics, and Dental. Any doctor can save their frequent combinations to local clinic storage with 1 click.
- **🖨️ Physical Letterhead Calibrator:** Toggle between **"Plain A4 Paper"** (prints clinic header/footer) and **"Doctor Pre-Printed Letterhead"** (suppresses header graphics and prints strictly on the blank space of the physical pad).
- **📱 1-Tap WhatsApp Rx Link (`wa.me`):** Generates clean, direct WhatsApp Web / app dispatch links to send digital prescriptions to patients without requiring complex external gateway setups.

---

### 2. 🎟️ Front Desk Reception Console & Token Desk
*Location:* [`apps/web/src/app/dashboard/desk/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/dashboard/desk/page.tsx) & [`apps/web/src/app/clinic/desk/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/clinic/desk/page.tsx)

- **Walk-in Token Generator:** Issue new tokens in under 3 seconds with Patient Name, Phone, and Fee.
- **Real-Time Cash vs. Soundbox UPI Inflows:** Live counter tallies showing cash in drawer vs. UPI direct to bank.
- **Built-in Web Audio Acoustic Chime Bell:** Dual-sine wave oscillator running directly in the browser—rings the clinic reception chime without requiring hardware token bells.
- **Real-Time SSE Event Broadcasting:** Token calls, consultations, and completions broadcast instantaneously over `GET /api/v1/clinic/stream`.

---

### 3. 📺 Waiting Room Smart TV Queue Display
*Location:* [`apps/web/src/app/display/waiting-room/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/display/waiting-room/page.tsx)

- **Zero-Setup Fullscreen TV Wall Display:** Runs directly inside the web browser of any Smart TV, Fire TV Stick, Android TV, or tablet without an app store download.
- **Hero "Now Serving" Spotlight:** High-contrast token spotlight with live chamber number, doctor name, and consultation status.
- **"Up Next" Waiting Lounge Queue:** Real-time queue board displaying upcoming tokens with dynamic estimated wait times.
- **Bilingual Acoustic Chime & Audio Announcer:** 4-tone Web Audio API soundbox chime paired with Web Speech API voice synthesis in English and Hindi (*"Token 103, please proceed to Chamber 1 / टोकन नंबर 103, कमरा नंबर 1 में आएं"*).

---

### 4. 🌙 9:00 PM Day-Closing Cockpit & Cash Drawer Settlement
*Location:* [`apps/web/src/app/dashboard/finance/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/dashboard/finance/page.tsx) & [`apps/api/app/api/v1/clinic.py`](file:///D:/medic-sept-2026/apps/api/app/api/v1/clinic.py)

- **Real Database Token Aggregation:** Queries actual SQLite `Appointment` and `Expense` records for today's date (`GET /api/v1/clinic/eod-summary`). If zero patients visited today, it reports 0. No hardcoded or fake numbers.
- **Cash Drawer Reconciliation:** Matches counted drawer cash against `Gross Cash Inflow - Counter Petty Expenses`. Automatically flags `✓ Balanced`, `Surplus`, or `Shortage`.
- **Visiting Specialist Fee Splits:** Automatically tracks contractual revenue splits (e.g. 80/20 or 75/25) vs. resident doctor retention with 1-click settlement vouchers.
- **🔒 Persistent SQLite Cryptographic Day Lock:** Finalizes the day's books and persists an immutable audit hash (`POST /api/v1/clinic/eod-lock`) to prevent back-dated tampering.
- **📱 1-Click WhatsApp Audit to Owner:** Dispatches a structured, executive Day-Closing summary directly to the clinic owner's WhatsApp.
- **📊 1-Click CA-Ready Tax Export (CSV):** Instant downloadable audit ledger formatted specifically for Chartered Accountants and GST reconciliation.

---

### 5. 🪧 Front Desk Acrylic Standee Studio
*Location:* [`apps/web/src/app/dashboard/standee/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/dashboard/standee/page.tsx)

- **Print-Ready Counter Standee:** Generates calibrated A5 / A4 acrylic standee artwork tailored for the clinic counter.
- **Live Patient Token Tracker QR:** Patients scan with their phone camera to track live token progression in real time without downloading an app.
- **Google 5-Star Reviews Booster QR:** Direct QR deep-link to the clinic's Google Maps review page.

---

## 🏗️ Architecture & Codebase Map

```
medic-sept-2026/
├── apps/
│   ├── api/                          # FastAPI Backend
│   │   ├── app/
│   │   │   ├── api/v1/
│   │   │   │   ├── clinic.py         # Token desk, SSE stream, shift settlement, real EOD summary & lock
│   │   │   │   ├── appointments.py   # Appointment booking and queue records
│   │   │   │   ├── prescriptions.py  # Rx generation, PDF layout, interaction checks
│   │   │   │   ├── expenses.py       # Clinic P&L vouchers & categories
│   │   │   │   └── doctors.py        # Doctor profiles, fees, chamber timings
│   │   │   ├── db/
│   │   │   │   ├── models.py         # SQLAlchemy SQLite ORM models (Appointment, Expense, ClinicEodClosing)
│   │   │   │   └── session.py        # Database session factory & engine
│   │   │   └── main.py               # Application entrypoint & CORS middleware
│   │   └── requirements.txt          # Python dependencies (FastAPI, SQLAlchemy, Uvicorn, etc.)
│   │
│   └── web/                          # Next.js 15 Web Application
│       ├── src/
│       │   ├── app/
│       │   │   ├── dashboard/
│       │   │   │   ├── desk/         # Reception Token Desk (walk-ins, cash vs UPI)
│       │   │   │   ├── consult/[id]/ # Speed Run Clinical Pad (Repeat Rx, combos, print)
│       │   │   │   ├── finance/      # 9 PM Executive Day-Closing & CA CSV export
│       │   │   │   ├── standee/      # Front Desk Acrylic Standee Studio
│       │   │   │   ├── chambers/     # Multi-chamber doctor queue view
│       │   │   │   └── patients/     # Patient EMR records & past prescription history
│       │   │   ├── display/
│       │   │   │   └── waiting-room/ # Smart TV fullscreen queue display & audio chime
│       │   │   ├── clinic/
│       │   │   │   └── settlement/   # Cash drawer physical denomination sheet
│       │   │   └── p/[id]/           # Patient digital prescription view
│       │   ├── lib/
│       │   │   └── api.ts            # Centralized API configuration (NEXT_PUBLIC_API_URL)
│       │   └── data/                 # Drug catalog and ICD-10 diagnostic protocols
```

---

## ⚡ Quickstart

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+

### 1. Backend Setup (FastAPI)
```bash
cd apps/api
# Create virtual environment (optional)
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start API server
uvicorn main:app --reload --port 8000
```
API Documentation will be live at: `http://localhost:8000/docs`

### 2. Frontend Setup (Next.js)
```bash
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:3000/dashboard/desk` to access the Reception Token Desk.

### 3. Environment Configuration
Create a `.env.local` file inside `apps/web`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
For local network deployment (e.g. running reception tablet or TV on the same Wi-Fi), replace `localhost` with your machine's local IP address (e.g. `http://192.168.1.15:8000`).

---

## 🔒 Data Privacy & Integrity
- **Local SQLite Database:** Patient records and day-closing books are stored locally in SQLite (`clinicos.db`). The database is kept strictly out of git version control.
- **Honest Dispatch:** WhatsApp shares use direct `wa.me` links initiated by staff or doctor action—no silent third-party data transmission.
- **Cryptographic Audit Hash:** Each daily EOD closure generates a unique SHA-256 seal record permanently stored in SQLite to detect tampering.
