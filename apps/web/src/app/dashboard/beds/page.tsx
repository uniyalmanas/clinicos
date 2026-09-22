"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { 
  Bed, 
  Building2, 
  UserPlus, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  Phone, 
  Stethoscope, 
  IndianRupee, 
  RotateCw, 
  Sparkles, 
  Printer, 
  Share2, 
  X,
  Filter,
  Check
} from "lucide-react";

interface WardInfo {
  id: string;
  name: string;
  ward_type: string;
  daily_rate: number;
  hourly_rate: number;
  total_beds: number;
  occupied_beds: number;
}

interface BedInfo {
  id: string;
  clinic_slug: string;
  ward_id: string;
  ward_name: string;
  ward_type: string;
  bed_number: string;
  status: "vacant" | "occupied" | "discharge_pending" | "maintenance";
  current_patient_name?: string | null;
  current_patient_phone?: string | null;
  assigned_doctor_name?: string | null;
  admission_notes?: string | null;
  admission_timestamp?: string | null;
  daily_rate: number;
  hourly_rate: number;
  stay_hours: number;
  accrued_charge: number;
}

interface DischargeReceipt {
  receipt_number: string;
  patient_name: string;
  patient_phone: string;
  assigned_doctor: string;
  bed_number: string;
  ward_name: string;
  admission_time: string;
  discharge_time: string;
  total_stay_hours: number;
  billing_basis: string;
  room_charges: number;
  payment_mode: string;
  payment_status: string;
}

export default function DashboardBedsPage() {
  const [beds, setBeds] = useState<BedInfo[]>([]);
  const [wards, setWards] = useState<WardInfo[]>([]);
  const [metrics, setMetrics] = useState({
    total_beds: 10,
    occupied_count: 4,
    vacant_count: 4,
    discharge_pending_count: 1,
    maintenance_count: 1,
    occupancy_rate_percent: 50.0,
    estimated_daily_revenue: 10000.0
  });
  const [loading, setLoading] = useState(true);
  const [activeWardFilter, setActiveWardFilter] = useState("all");
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");

  // Modals state
  const [admitModalBed, setAdmitModalBed] = useState<BedInfo | null>(null);
  const [admitForm, setAdmitForm] = useState({
    patient_name: "",
    patient_phone: "+91 9",
    assigned_doctor_name: "Dr. Rahul Sharma",
    admission_notes: "Clinical monitoring & post-treatment recovery."
  });

  const [dischargeModalBed, setDischargeModalBed] = useState<BedInfo | null>(null);
  const [dischargePaymentMode, setDischargePaymentMode] = useState<"upi" | "cash">("upi");
  const [markMaintenanceOnDischarge, setMarkMaintenanceOnDischarge] = useState(true);
  const [completedReceipt, setCompletedReceipt] = useState<DischargeReceipt | null>(null);

  // Load beds from API with fallback
  const fetchBeds = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds`);
      if (res.ok) {
        const data = await res.json();
        setBeds(data.beds || []);
        setWards(data.wards || []);
        setMetrics(data.metrics || metrics);
      } else {
        loadFallbackBeds();
      }
    } catch (err) {
      loadFallbackBeds();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackBeds = () => {
    const fallbackWards: WardInfo[] = [
      { id: "ward-1", name: "Daycare Recovery Suite", ward_type: "daycare_recovery", daily_rate: 1400, hourly_rate: 150, total_beds: 3, occupied_beds: 1 },
      { id: "ward-2", name: "Private Deluxe Suite", ward_type: "private_deluxe", daily_rate: 3200, hourly_rate: 300, total_beds: 2, occupied_beds: 2 },
      { id: "ward-3", name: "General Observation Ward", ward_type: "general", daily_rate: 900, hourly_rate: 100, total_beds: 3, occupied_beds: 1 },
      { id: "ward-4", name: "Emergency HDU & Monitoring", ward_type: "icu", daily_rate: 4500, hourly_rate: 450, total_beds: 2, occupied_beds: 1 }
    ];

    const fallbackBeds: BedInfo[] = [
      {
        id: "bed-01",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-1",
        ward_name: "Daycare Recovery Suite",
        ward_type: "daycare_recovery",
        bed_number: "DC-01",
        status: "occupied",
        current_patient_name: "Amit Rawat",
        current_patient_phone: "+919123456780",
        assigned_doctor_name: "Dr. Rahul Sharma",
        admission_notes: "Post-PRP laser therapy recovery. Monitor vitals for 4 hours.",
        admission_timestamp: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
        daily_rate: 1400,
        hourly_rate: 150,
        stay_hours: 3.5,
        accrued_charge: 525
      },
      {
        id: "bed-02",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-1",
        ward_name: "Daycare Recovery Suite",
        ward_type: "daycare_recovery",
        bed_number: "DC-02",
        status: "vacant",
        daily_rate: 1400,
        hourly_rate: 150,
        stay_hours: 0,
        accrued_charge: 0
      },
      {
        id: "bed-03",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-1",
        ward_name: "Daycare Recovery Suite",
        ward_type: "daycare_recovery",
        bed_number: "DC-03",
        status: "vacant",
        daily_rate: 1400,
        hourly_rate: 150,
        stay_hours: 0,
        accrued_charge: 0
      },
      {
        id: "bed-04",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-2",
        ward_name: "Private Deluxe Suite",
        ward_type: "private_deluxe",
        bed_number: "DLX-101",
        status: "occupied",
        current_patient_name: "Sunita Joshi",
        current_patient_phone: "+919876543299",
        assigned_doctor_name: "Dr. Rahul Sharma",
        admission_notes: "Admitted for acute drug-induced urticarial rash and systemic observation.",
        admission_timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        daily_rate: 3200,
        hourly_rate: 300,
        stay_hours: 18.0,
        accrued_charge: 3200
      },
      {
        id: "bed-05",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-2",
        ward_name: "Private Deluxe Suite",
        ward_type: "private_deluxe",
        bed_number: "DLX-102",
        status: "discharge_pending",
        current_patient_name: "Pooja Rawat",
        current_patient_phone: "+919876511223",
        assigned_doctor_name: "Dr. Aditi Joshi",
        admission_notes: "Post-op jaw observation. Final discharge summary pending doctor sign-off.",
        admission_timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
        daily_rate: 3200,
        hourly_rate: 300,
        stay_hours: 26.0,
        accrued_charge: 6400
      },
      {
        id: "bed-06",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-3",
        ward_name: "General Observation Ward",
        ward_type: "general",
        bed_number: "GEN-01",
        status: "occupied",
        current_patient_name: "Rajesh Mehra",
        current_patient_phone: "+919876522334",
        assigned_doctor_name: "Dr. Vikram Sethi",
        admission_notes: "Pediatric hydration monitoring and nebulization support.",
        admission_timestamp: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
        daily_rate: 900,
        hourly_rate: 100,
        stay_hours: 7.0,
        accrued_charge: 700
      },
      {
        id: "bed-07",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-3",
        ward_name: "General Observation Ward",
        ward_type: "general",
        bed_number: "GEN-02",
        status: "vacant",
        daily_rate: 900,
        hourly_rate: 100,
        stay_hours: 0,
        accrued_charge: 0
      },
      {
        id: "bed-08",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-3",
        ward_name: "General Observation Ward",
        ward_type: "general",
        bed_number: "GEN-03",
        status: "maintenance",
        daily_rate: 900,
        hourly_rate: 100,
        stay_hours: 0,
        accrued_charge: 0
      },
      {
        id: "bed-09",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-4",
        ward_name: "Emergency HDU & Monitoring",
        ward_type: "icu",
        bed_number: "HDU-01",
        status: "vacant",
        daily_rate: 4500,
        hourly_rate: 450,
        stay_hours: 0,
        accrued_charge: 0
      },
      {
        id: "bed-10",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-4",
        ward_name: "Emergency HDU & Monitoring",
        ward_type: "icu",
        bed_number: "HDU-02",
        status: "occupied",
        current_patient_name: "Mohan Lal Verma",
        current_patient_phone: "+919876533445",
        assigned_doctor_name: "Dr. Rahul Sharma",
        admission_notes: "Severe anaphylactoid reaction. Continuous oxygen and SpO2 monitoring.",
        admission_timestamp: new Date(Date.now() - 11.5 * 3600 * 1000).toISOString(),
        daily_rate: 4500,
        hourly_rate: 450,
        stay_hours: 11.5,
        accrued_charge: 4500
      }
    ];

    setWards(fallbackWards);
    setBeds(fallbackBeds);
  };

  useEffect(() => {
    fetchBeds();
  }, []);

  // Filter beds
  const filteredBeds = beds.filter((b) => {
    const matchesWard = activeWardFilter === "all" || b.ward_type === activeWardFilter;
    const matchesStatus = activeStatusFilter === "all" || b.status === activeStatusFilter;
    return matchesWard && matchesStatus;
  });

  // Handle patient admission
  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitModalBed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/admit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bed_id: admitModalBed.id,
          patient_name: admitForm.patient_name,
          patient_phone: admitForm.patient_phone,
          assigned_doctor_name: admitForm.assigned_doctor_name,
          admission_notes: admitForm.admission_notes
        })
      });

      if (res.ok) {
        await fetchBeds();
      } else {
        // Update locally
        setBeds((prev) =>
          prev.map((b) =>
            b.id === admitModalBed.id
              ? {
                  ...b,
                  status: "occupied",
                  current_patient_name: admitForm.patient_name,
                  current_patient_phone: admitForm.patient_phone,
                  assigned_doctor_name: admitForm.assigned_doctor_name,
                  admission_notes: admitForm.admission_notes,
                  admission_timestamp: new Date().toISOString(),
                  stay_hours: 0.1,
                  accrued_charge: b.hourly_rate
                }
              : b
          )
        );
      }
    } catch {
      // Local fallback
      setBeds((prev) =>
        prev.map((b) =>
          b.id === admitModalBed.id
            ? {
                ...b,
                status: "occupied",
                current_patient_name: admitForm.patient_name,
                current_patient_phone: admitForm.patient_phone,
                assigned_doctor_name: admitForm.assigned_doctor_name,
                admission_notes: admitForm.admission_notes,
                admission_timestamp: new Date().toISOString(),
                stay_hours: 0.1,
                accrued_charge: b.hourly_rate
              }
            : b
        )
      );
    } finally {
      setAdmitModalBed(null);
      setAdmitForm({
        patient_name: "",
        patient_phone: "+91 9",
        assigned_doctor_name: "Dr. Rahul Sharma",
        admission_notes: "Clinical monitoring & post-treatment recovery."
      });
    }
  };

  // Handle patient discharge
  const handleDischargeConfirm = async () => {
    if (!dischargeModalBed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/discharge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bed_id: dischargeModalBed.id,
          payment_mode: dischargePaymentMode,
          mark_as_maintenance: markMaintenanceOnDischarge
        })
      });

      if (res.ok) {
        const json = await res.json();
        setCompletedReceipt(json.invoice);
        await fetchBeds();
      } else {
        simulateLocalDischarge(dischargeModalBed);
      }
    } catch {
      simulateLocalDischarge(dischargeModalBed);
    } finally {
      setDischargeModalBed(null);
    }
  };

  const simulateLocalDischarge = (b: BedInfo) => {
    const receipt: DischargeReceipt = {
      receipt_number: `DISC-${b.bed_number}-${Math.floor(100000 + Math.random() * 900000)}`,
      patient_name: b.current_patient_name || "Patient",
      patient_phone: b.current_patient_phone || "+91 98765 00000",
      assigned_doctor: b.assigned_doctor_name || "Dr. Rahul Sharma",
      bed_number: b.bed_number,
      ward_name: b.ward_name,
      admission_time: b.admission_timestamp ? new Date(b.admission_timestamp).toLocaleString("en-IN") : "Today 10:00 AM",
      discharge_time: new Date().toLocaleString("en-IN"),
      total_stay_hours: b.stay_hours || 4.5,
      billing_basis: b.stay_hours <= 12 ? `${b.stay_hours} hrs @ ₹${b.hourly_rate}/hr` : `1 Day @ ₹${b.daily_rate}/day`,
      room_charges: b.accrued_charge || b.daily_rate,
      payment_mode: dischargePaymentMode.toUpperCase(),
      payment_status: "PAID"
    };

    setCompletedReceipt(receipt);

    setBeds((prev) =>
      prev.map((item) =>
        item.id === b.id
          ? {
              ...item,
              status: markMaintenanceOnDischarge ? "maintenance" : "vacant",
              current_patient_name: null,
              current_patient_phone: null,
              assigned_doctor_name: null,
              admission_notes: null,
              admission_timestamp: null,
              stay_hours: 0,
              accrued_charge: 0
            }
          : item
      )
    );
  };

  // Quick 1-click status toggling (e.g. mark bed as ready after maintenance)
  const handleQuickStatusChange = async (bedId: string, newStatus: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/beds/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bed_id: bedId, status: newStatus })
      });
    } catch {
      // ignore
    }

    setBeds((prev) =>
      prev.map((b) => (b.id === bedId ? { ...b, status: newStatus as any } : b))
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & REFRESH */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#0071E3]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#0071E3] dark:text-[#2997FF] uppercase tracking-wider">
              Inpatient Care & Admissions
            </span>
            <span className="flex h-2 w-2 rounded-full bg-[#30D158] animate-pulse"></span>
            <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">Live Matrix</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#1D1D1F] dark:text-white sm:text-3xl">
            Inpatient Bed Matrix & Wards
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
            Real-time occupancy, admission check-in, stay billing calculation, and sanitization logging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBeds}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] shadow-apple-sm transition hover:bg-black/[0.02] dark:border-white/[0.1] dark:bg-[#1C1C1E] dark:text-white"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#0071E3]" : ""}`} />
            <span>Sync Wards</span>
          </button>
        </div>
      </div>

      {/* 2. TOP METRIC STATS (APPLE HEALTH STYLE CARDS) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Beds */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] transition hover:shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Inpatient Beds</span>
            <div className="rounded-[12px] bg-[#0071E3]/10 p-2 text-[#0071E3] dark:text-[#2997FF]">
              <Bed className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono tracking-tight">
            {metrics.total_beds} <span className="text-xs font-normal text-[#86868B] dark:text-[#8E8E93]">Across 4 Wards</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#0071E3] dark:text-[#2997FF] font-semibold">
            <span>{wards.length} Ward Suites configured</span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] transition hover:shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Occupancy Rate</span>
            <div className="rounded-[12px] bg-[#FF9500]/10 p-2 text-[#FF9500] dark:text-[#FF9F0A]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono tracking-tight">
            {metrics.occupancy_rate_percent}%
          </div>
          <div className="mt-2.5 w-full bg-black/[0.06] dark:bg-white/[0.1] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-[#FF9500] h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, metrics.occupancy_rate_percent)}%` }}
            />
          </div>
        </div>

        {/* Vacant Beds */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] transition hover:shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Vacant & Ready</span>
            <div className="rounded-[12px] bg-[#34C759]/10 p-2 text-[#34C759] dark:text-[#30D158]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#34C759] dark:text-[#30D158] font-mono tracking-tight">
            {metrics.vacant_count} <span className="text-xs font-normal text-[#86868B] dark:text-[#8E8E93]">Available Now</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-xs text-[#86868B] dark:text-[#8E8E93]">
            <span>{metrics.maintenance_count} bed in sanitization</span>
          </div>
        </div>

        {/* Daily Inpatient Run-Rate */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] transition hover:shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Est. Room Run-Rate</span>
            <div className="rounded-[12px] bg-[#AF52DE]/10 p-2 text-[#AF52DE] dark:text-[#BF5AF2]">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono tracking-tight">
            ₹{metrics.estimated_daily_revenue.toLocaleString()}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#34C759] dark:text-[#30D158] font-semibold">
            <span>Accruing from active stays</span>
          </div>
        </div>
      </div>

      {/* 3. WARD & STATUS FILTER TABS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-[#1C1C1E] p-3 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm">
        {/* Ward Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Wards" },
            { id: "daycare_recovery", label: "Daycare Suite" },
            { id: "private_deluxe", label: "Private Deluxe" },
            { id: "general", label: "General Ward" },
            { id: "icu", label: "Emergency HDU" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveWardFilter(tab.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                activeWardFilter === tab.id
                  ? "bg-[#0071E3] text-white shadow-sm"
                  : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F] dark:bg-white/[0.06] dark:text-[#8E8E93] dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] mr-1 hidden md:inline">
            Status:
          </span>
          {[
            { id: "all", label: "All" },
            { id: "vacant", label: "Vacant (Green)", color: "text-[#34C759]" },
            { id: "occupied", label: "Occupied (Red)", color: "text-[#FF3B30]" },
            { id: "discharge_pending", label: "Discharge Pending", color: "text-[#FF9500]" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatusFilter(tab.id)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                activeStatusFilter === tab.id
                  ? "bg-black/[0.08] text-[#1D1D1F] dark:bg-white/[0.12] dark:text-white shadow-sm"
                  : "text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. INTERACTIVE BED MATRIX GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBeds.map((bed) => {
          const isOccupied = bed.status === "occupied";
          const isDischargePending = bed.status === "discharge_pending";
          const isVacant = bed.status === "vacant";
          const isMaintenance = bed.status === "maintenance";

          return (
            <div
              key={bed.id}
              className={`relative rounded-[22px] border p-5 shadow-apple-card transition hover:shadow-apple-sm flex flex-col justify-between ${
                isOccupied
                  ? "bg-white border-[#FF3B30]/30 dark:bg-[#1C1C1E] dark:border-[#FF453A]/40"
                  : isDischargePending
                  ? "bg-white border-[#FF9500]/30 dark:bg-[#1C1C1E] dark:border-[#FF9F0A]/40"
                  : isMaintenance
                  ? "bg-[#F5F5F7] border-black/[0.06] dark:bg-[#151516] dark:border-white/[0.06] opacity-90"
                  : "bg-white border-[#34C759]/30 dark:bg-[#1C1C1E] dark:border-[#30D158]/40"
              }`}
            >
              {/* Top Card Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-[#1D1D1F] dark:text-white">
                        {bed.bed_number}
                      </span>
                      <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">
                        {bed.ward_name}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                      ₹{bed.daily_rate}/day • ₹{bed.hourly_rate}/hr
                    </div>
                  </div>

                  {/* Status Badge with animated dot */}
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      isOccupied
                        ? "bg-[#FF3B30]/10 text-[#FF3B30] dark:text-[#FF453A]"
                        : isDischargePending
                        ? "bg-[#FF9500]/10 text-[#FF9500] dark:text-[#FF9F0A]"
                        : isMaintenance
                        ? "bg-black/[0.06] text-[#86868B] dark:bg-white/[0.1] dark:text-[#8E8E93]"
                        : "bg-[#34C759]/10 text-[#34C759] dark:text-[#30D158]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isOccupied
                          ? "bg-[#FF3B30]"
                          : isDischargePending
                          ? "bg-[#FF9500] animate-pulse"
                          : isMaintenance
                          ? "bg-[#86868B]"
                          : "bg-[#34C759]"
                      }`}
                    />
                    <span className="capitalize">
                      {isDischargePending ? "Discharge Due" : bed.status}
                    </span>
                  </div>
                </div>

                {/* Patient Information if Occupied or Discharge Pending */}
                {(isOccupied || isDischargePending) && (
                  <div className="mt-4 rounded-[16px] bg-black/[0.02] dark:bg-white/[0.04] p-3 border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                        {bed.current_patient_name}
                      </span>
                      <span className="text-[10px] text-[#86868B] dark:text-[#8E8E93] font-mono">
                        {bed.current_patient_phone}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                      <Stethoscope className="h-3 w-3 text-[#0071E3]" />
                      <span>{bed.assigned_doctor_name || "Dr. Rahul Sharma"}</span>
                    </div>

                    {bed.admission_notes && (
                      <p className="text-[11px] text-[#1D1D1F]/80 dark:text-[#F5F5F7]/80 line-clamp-2 italic bg-white/50 dark:bg-black/20 p-1.5 rounded-[8px]">
                        &ldquo;{bed.admission_notes}&rdquo;
                      </p>
                    )}

                    {/* Stay Duration and Accrued Bill */}
                    <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-[#86868B] dark:text-[#8E8E93]">
                        <Clock className="h-3 w-3" />
                        <span>{bed.stay_hours} hrs elapsed</span>
                      </div>
                      <div className="font-mono font-bold text-[#1D1D1F] dark:text-white">
                        ₹{bed.accrued_charge.toLocaleString()} <span className="text-[10px] text-[#86868B] font-normal">due</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vacant State Info */}
                {isVacant && (
                  <div className="mt-4 rounded-[16px] bg-[#34C759]/5 border border-[#34C759]/10 p-3 text-center">
                    <CheckCircle2 className="h-5 w-5 text-[#34C759] mx-auto mb-1" />
                    <div className="text-xs font-bold text-[#34C759] dark:text-[#30D158]">
                      Sanitized & Ready
                    </div>
                    <p className="text-[10px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                      Linen changed, sterile monitors connected. Ready for emergency or daycare admission.
                    </p>
                  </div>
                )}

                {/* Maintenance State Info */}
                {isMaintenance && (
                  <div className="mt-4 rounded-[16px] bg-black/[0.03] dark:bg-white/[0.03] p-3 text-center">
                    <AlertCircle className="h-5 w-5 text-[#FF9500] mx-auto mb-1" />
                    <div className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                      Sanitization in Progress
                    </div>
                    <p className="text-[10px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                      Housekeeping protocol active. Deep UV surface disinfection required.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-5 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                {isVacant && (
                  <button
                    onClick={() => setAdmitModalBed(bed)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-[12px] bg-[#0071E3] py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0077ED]"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Admit Patient Here</span>
                  </button>
                )}

                {(isOccupied || isDischargePending) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDischargeModalBed(bed)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-[12px] bg-[#FF3B30] py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#E02D22]"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Discharge & Bill</span>
                    </button>
                    {isOccupied && (
                      <button
                        onClick={() => handleQuickStatusChange(bed.id, "discharge_pending")}
                        title="Mark for discharge"
                        className="rounded-[12px] border border-black/[0.08] dark:border-white/[0.1] p-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.02]"
                      >
                        <Clock className="h-3.5 w-3.5 text-[#FF9500]" />
                      </button>
                    )}
                  </div>
                )}

                {isMaintenance && (
                  <button
                    onClick={() => handleQuickStatusChange(bed.id, "vacant")}
                    className="w-full flex items-center justify-center gap-1.5 rounded-[12px] bg-[#34C759] py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#2EB34E]"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Mark Sanitized & Ready</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. ADMISSION MODAL */}
      {admitModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-[24px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="rounded-[12px] bg-[#0071E3]/10 p-2 text-[#0071E3] dark:text-[#2997FF]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                    Admit to Bed {admitModalBed.bed_number}
                  </h2>
                  <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                    {admitModalBed.ward_name} (₹{admitModalBed.daily_rate}/day)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdmitModalBed(null)}
                className="rounded-full p-1.5 text-[#86868B] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdmitSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868B] dark:text-[#8E8E93]">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meenakshi Sundaram"
                  value={admitForm.patient_name}
                  onChange={(e) => setAdmitForm({ ...admitForm, patient_name: e.target.value })}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.1] bg-white px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] focus:border-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#86868B] dark:text-[#8E8E93]">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={admitForm.patient_phone}
                    onChange={(e) => setAdmitForm({ ...admitForm, patient_phone: e.target.value })}
                    className="mt-1 w-full rounded-[12px] border border-black/[0.1] bg-white px-3.5 py-2 text-xs font-mono font-semibold text-[#1D1D1F] focus:border-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#86868B] dark:text-[#8E8E93]">
                    Assigned Doctor
                  </label>
                  <select
                    value={admitForm.assigned_doctor_name}
                    onChange={(e) => setAdmitForm({ ...admitForm, assigned_doctor_name: e.target.value })}
                    className="mt-1 w-full rounded-[12px] border border-black/[0.1] bg-white px-3 py-2 text-xs font-semibold text-[#1D1D1F] focus:border-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
                  >
                    <option value="Dr. Rahul Sharma">Dr. Rahul Sharma (Dermatology)</option>
                    <option value="Dr. Aditi Joshi">Dr. Aditi Joshi (Dental/Oral)</option>
                    <option value="Dr. Vikram Sethi">Dr. Vikram Sethi (Pediatrics)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868B] dark:text-[#8E8E93]">
                  Admission Indication / Clinical Notes
                </label>
                <textarea
                  rows={3}
                  value={admitForm.admission_notes}
                  onChange={(e) => setAdmitForm({ ...admitForm, admission_notes: e.target.value })}
                  placeholder="e.g. Post-treatment recovery, vitals monitoring, oxygen support."
                  className="mt-1 w-full rounded-[12px] border border-black/[0.1] bg-white px-3.5 py-2 text-xs text-[#1D1D1F] focus:border-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setAdmitModalBed(null)}
                  className="rounded-[12px] px-4 py-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[12px] bg-[#0071E3] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0077ED]"
                >
                  Confirm Bed Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DISCHARGE & STAY BILLING MODAL */}
      {dischargeModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[24px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="rounded-[12px] bg-[#FF3B30]/10 p-2 text-[#FF3B30] dark:text-[#FF453A]">
                  <LogOut className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                    Discharge & Stay Billing
                  </h2>
                  <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                    {dischargeModalBed.bed_number} • {dischargeModalBed.current_patient_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDischargeModalBed(null)}
                className="rounded-full p-1.5 text-[#86868B] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-[16px] bg-black/[0.02] dark:bg-white/[0.04] p-4 border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#86868B]">Stay Duration:</span>
                  <span className="font-mono font-bold text-[#1D1D1F] dark:text-white">
                    {dischargeModalBed.stay_hours} hours
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#86868B]">Ward Rate Basis:</span>
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">
                    {dischargeModalBed.stay_hours <= 12 
                      ? `₹${dischargeModalBed.hourly_rate}/hr (Daycare)` 
                      : `₹${dischargeModalBed.daily_rate}/day (Overnight)`}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <span className="font-bold text-[#1D1D1F] dark:text-white">Total Room Charges:</span>
                  <span className="font-mono font-black text-base text-[#0071E3] dark:text-[#2997FF]">
                    ₹{dischargeModalBed.accrued_charge.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868B] dark:text-[#8E8E93] mb-1.5">
                  Collection Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDischargePaymentMode("upi")}
                    className={`rounded-[12px] py-2 text-xs font-bold border transition ${
                      dischargePaymentMode === "upi"
                        ? "bg-[#0071E3] text-white border-[#0071E3]"
                        : "border-black/[0.08] dark:border-white/[0.1] text-[#1D1D1F] dark:text-white"
                    }`}
                  >
                    UPI QR Intent
                  </button>
                  <button
                    type="button"
                    onClick={() => setDischargePaymentMode("cash")}
                    className={`rounded-[12px] py-2 text-xs font-bold border transition ${
                      dischargePaymentMode === "cash"
                        ? "bg-[#0071E3] text-white border-[#0071E3]"
                        : "border-black/[0.08] dark:border-white/[0.1] text-[#1D1D1F] dark:text-white"
                    }`}
                  >
                    Cash at Counter
                  </button>
                </div>
              </div>

              {/* Sanitization Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={markMaintenanceOnDischarge}
                  onChange={(e) => setMarkMaintenanceOnDischarge(e.target.checked)}
                  className="rounded text-[#0071E3] focus:ring-0"
                />
                <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                  Route bed to sanitization/maintenance before next patient intake
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setDischargeModalBed(null)}
                  className="rounded-[12px] px-4 py-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDischargeConfirm}
                  className="rounded-[12px] bg-[#FF3B30] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#E02D22]"
                >
                  Discharge & Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. DISCHARGE RECEIPT PRINTABLE MODAL */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[24px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]">
            <div className="text-center pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#34C759]/10 text-[#34C759] mx-auto mb-2">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-black text-[#1D1D1F] dark:text-white">
                Discharge Invoice & Receipt
              </h2>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93] font-mono mt-0.5">
                #{completedReceipt.receipt_number}
              </p>
            </div>

            <div className="my-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-[#86868B]">
                <span>Patient:</span>
                <span className="font-bold text-[#1D1D1F] dark:text-white">{completedReceipt.patient_name}</span>
              </div>
              <div className="flex justify-between text-[#86868B]">
                <span>Contact:</span>
                <span className="text-[#1D1D1F] dark:text-white">{completedReceipt.patient_phone}</span>
              </div>
              <div className="flex justify-between text-[#86868B]">
                <span>Bed / Ward:</span>
                <span className="font-bold text-[#1D1D1F] dark:text-white">{completedReceipt.bed_number} ({completedReceipt.ward_name})</span>
              </div>
              <div className="flex justify-between text-[#86868B]">
                <span>Attending Doctor:</span>
                <span className="text-[#1D1D1F] dark:text-white">{completedReceipt.assigned_doctor}</span>
              </div>
              <div className="flex justify-between text-[#86868B]">
                <span>Admission Time:</span>
                <span className="text-[#1D1D1F] dark:text-white">{completedReceipt.admission_time}</span>
              </div>
              <div className="flex justify-between text-[#86868B]">
                <span>Discharge Time:</span>
                <span className="text-[#1D1D1F] dark:text-white">{completedReceipt.discharge_time}</span>
              </div>
              <div className="flex justify-between text-[#86868B]">
                <span>Stay Duration:</span>
                <span className="text-[#1D1D1F] dark:text-white">{completedReceipt.total_stay_hours} hrs</span>
              </div>
              <div className="pt-2 border-t border-dashed border-black/[0.1] dark:border-white/[0.1] flex justify-between text-sm">
                <span className="font-black text-[#1D1D1F] dark:text-white">Total Paid ({completedReceipt.payment_mode}):</span>
                <span className="font-black text-[#34C759] dark:text-[#30D158]">₹{completedReceipt.room_charges.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-[12px] bg-black/[0.04] dark:bg-white/[0.08] py-2 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.08]"
              >
                <Printer className="h-4 w-4" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedReceipt(null)}
                className="flex-1 rounded-[12px] bg-[#0071E3] py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0077ED]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
