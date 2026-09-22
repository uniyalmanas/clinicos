"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import {
  ArrowLeft,
  Pill,
  FlaskConical,
  Building2,
  Phone,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  BadgeCheck,
  RefreshCw,
  Sparkles,
  DollarSign,
  TrendingUp,
  FileText
} from "lucide-react";

interface InquiryRecord {
  id: string;
  inquiry_token: string;
  inquiry_type: "medicine" | "lab_test";
  patient_name: string;
  patient_phone: string;
  locality: string;
  target_entity_name: string;
  target_entity_phone: string;
  items: { name: string; qty: number; form?: string; price: number }[];
  prescription_preview?: string;
  notes?: string;
  channel: string;
  status: "dispatched" | "contacted" | "fulfilled" | "cancelled";
  created_at?: string;
}

interface PartnerRecord {
  id: string;
  partner_type: "pharmacy" | "diagnostic_lab";
  business_name: string;
  contact_person: string;
  phone: string;
  whatsapp: string;
  locality: string;
  address: string;
  license_number?: string;
  home_service: boolean;
  is_verified: boolean;
  status: string;
  created_at?: string;
}

const SEED_INQUIRIES: InquiryRecord[] = [
  {
    id: "inq-01",
    inquiry_token: "COS-MED-4912",
    inquiry_type: "medicine",
    patient_name: "Rahul Verma",
    patient_phone: "+919876543201",
    locality: "Rajpur Road, Dehradun",
    target_entity_name: "Doon Medicos & Surgical",
    target_entity_phone: "+919876543211",
    items: [
      { name: "Augmentin 625 Duo", qty: 1, form: "Tablet", price: 185 },
      { name: "Pan-40", qty: 1, form: "Tablet", price: 130 },
      { name: "Dolo 650", qty: 2, form: "Tablet", price: 30 }
    ],
    prescription_preview: "Uploaded Rx: dr_sharma_prescription.jpg",
    notes: "Delivery mode: delivery",
    channel: "whatsapp",
    status: "dispatched",
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "inq-02",
    inquiry_token: "COS-LAB-7821",
    inquiry_type: "lab_test",
    patient_name: "Pooja Bisht",
    patient_phone: "+919876543202",
    locality: "EC Road, Dehradun",
    target_entity_name: "Doon Pathology & Molecular Diagnostics",
    target_entity_phone: "+919876543223",
    items: [
      { name: "Complete Blood Count (CBC) with ESR", qty: 1, form: "Test", price: 280 },
      { name: "Thyroid Profile Total (T3, T4, TSH)", qty: 1, form: "Test", price: 320 }
    ],
    prescription_preview: "Slot: Tomorrow Morning (07:00 AM - 08:30 AM)",
    notes: "Home Collection: Yes",
    channel: "whatsapp",
    status: "contacted",
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "inq-03",
    inquiry_token: "COS-MED-8190",
    inquiry_type: "medicine",
    patient_name: "Suresh Negi",
    patient_phone: "+919876543203",
    locality: "Ballupur, Dehradun",
    target_entity_name: "Ballupur 24x7 Health Pharmacy",
    target_entity_phone: "+919876543213",
    items: [
      { name: "Telma-40", qty: 2, form: "Tablet", price: 189 },
      { name: "Glycomet-500 SR", qty: 2, form: "Tablet", price: 45 }
    ],
    prescription_preview: "Repeat chronic medication order",
    notes: "Delivery mode: pickup",
    channel: "whatsapp",
    status: "fulfilled",
    created_at: new Date(Date.now() - 18000000).toISOString()
  }
];

const SEED_PARTNERS: PartnerRecord[] = [
  {
    id: "part-01",
    partner_type: "pharmacy",
    business_name: "Doon Medicos & Surgical",
    contact_person: "Gaurav Aggarwal (R.Ph)",
    phone: "+919876543211",
    whatsapp: "919876543211",
    locality: "Rajpur Road",
    address: "16, Rajpur Road, Opp. Ashley Hall, Dehradun",
    license_number: "UK-DDN-20/21-8941",
    home_service: true,
    is_verified: true,
    status: "verified",
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "part-02",
    partner_type: "pharmacy",
    business_name: "City Chemist & Healthcare",
    contact_person: "Sunil Verma (B.Pharm)",
    phone: "+919876543212",
    whatsapp: "919876543212",
    locality: "EC Road",
    address: "44, EC Road, Near Survey Chowk, Dehradun",
    license_number: "UK-DDN-20/21-6102",
    home_service: true,
    is_verified: true,
    status: "verified",
    created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: "part-03",
    partner_type: "diagnostic_lab",
    business_name: "Dr. Lal PathLabs National Reference Partner",
    contact_person: "Dr. Anirudh Saxena (Pathologist)",
    phone: "+919876543221",
    whatsapp: "919876543221",
    locality: "Rajpur Road",
    address: "28, Rajpur Road, Opp. St. Joseph's Academy, Dehradun",
    license_number: "NABL-MC-2018-941",
    home_service: true,
    is_verified: true,
    status: "verified",
    created_at: new Date(Date.now() - 259200000).toISOString()
  }
];

export default function AdminInquiriesPage() {
  const [activeTab, setActiveTab] = useState<"inquiries" | "partners">("inquiries");
  const [inquiries, setInquiries] = useState<InquiryRecord[]>(SEED_INQUIRIES);
  const [partners, setPartners] = useState<PartnerRecord[]>(SEED_PARTNERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const fetchLiveInquiries = async () => {
    setLoading(true);
    try {
      const resInq = await fetch(`${API_BASE_URL}/api/v1/marketplace/inquiries`);
      if (resInq.ok) {
        const data = await resInq.json();
        if (Array.isArray(data) && data.length > 0) {
          setInquiries(data);
        }
      }
      const resPart = await fetch(`${API_BASE_URL}/api/v1/marketplace/partners`);
      if (resPart.ok) {
        const data = await resPart.json();
        if (Array.isArray(data) && data.length > 0) {
          setPartners(data);
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveInquiries();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "dispatched" | "contacted" | "fulfilled") => {
    setInquiries((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );

    try {
      await fetch(`${API_BASE_URL}/api/v1/marketplace/inquiries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch {
      // Local fallback
    }
  };

  // Metrics
  const totalMedsValue = inquiries
    .filter((i) => i.inquiry_type === "medicine")
    .reduce((sum, i) => sum + i.items.reduce((s, it) => s + it.price * it.qty, 0), 0);

  const totalLabsValue = inquiries
    .filter((i) => i.inquiry_type === "lab_test")
    .reduce((sum, i) => sum + i.items.reduce((s, it) => s + it.price * it.qty, 0), 0);

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesSearch =
      inq.inquiry_token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.target_entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.locality.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || inq.inquiry_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0071E3] text-white shadow-sm">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">Marketplace & Network Ledger</span>
                <span className="rounded bg-[#0071E3]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0071E3]">
                  SuperAdmin
                </span>
              </div>
              <p className="text-xs text-slate-500">Medicines, Diagnostic Labs, & Zero-Commission Orders</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/admin/verifications"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              NMC Doctors
            </Link>
            <button
              onClick={fetchLiveInquiries}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#0071E3]" : ""}`} />
              Sync
            </button>
          </div>
        </div>
      </header>

      {/* 2. METRICS OVERVIEW */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Medicine Inquiries</span>
              <Pill className="h-4 w-4 text-[#0071E3]" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              {inquiries.filter((i) => i.inquiry_type === "medicine").length} Orders
            </div>
            <p className="mt-1 text-xs text-emerald-600 font-semibold">
              Est. GMV: ₹{totalMedsValue.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Lab Test Inquiries</span>
              <FlaskConical className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              {inquiries.filter((i) => i.inquiry_type === "lab_test").length} Bookings
            </div>
            <p className="mt-1 text-xs text-emerald-600 font-semibold">
              Est. GMV: ₹{totalLabsValue.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Partner Pharmacies</span>
              <Building2 className="h-4 w-4 text-[#34C759]" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              {partners.filter((p) => p.partner_type === "pharmacy").length} Active
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Dehradun Verified Counters
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Diagnostic Lab Partners</span>
              <BadgeCheck className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              {partners.filter((p) => p.partner_type === "diagnostic_lab").length} NABL Labs
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Free Home Sample Collection
            </p>
          </div>
        </div>

        {/* 3. TABS & SEARCH BAR */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
            <button
              onClick={() => setActiveTab("inquiries")}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition ${
                activeTab === "inquiries"
                  ? "border-[#0071E3] text-[#0071E3]"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Patient Inquiries & Orders ({inquiries.length})
            </button>
            <button
              onClick={() => setActiveTab("partners")}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition ${
                activeTab === "partners"
                  ? "border-[#0071E3] text-[#0071E3]"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Verified Partner Stores & Labs ({partners.length})
            </button>
          </div>

          {activeTab === "inquiries" && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search token, patient, store..."
                  className="pl-9 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="medicine">Medicines Only</option>
                <option value="lab_test">Lab Tests Only</option>
              </select>
            </div>
          )}
        </div>

        {/* 4. CONTENT TABLE / LISTING */}
        <div className="mt-4 mb-12">
          {activeTab === "inquiries" ? (
            <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3">Token & Time</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Patient Details</th>
                      <th className="px-5 py-3">Fulfillment Partner</th>
                      <th className="px-5 py-3">Items Requested</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredInquiries.map((inq) => {
                      const totalOrderValue = inq.items.reduce((s, it) => s + it.price * it.qty, 0);
                      return (
                        <tr key={inq.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-[#0071E3] block">
                              #{inq.inquiry_token}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {inq.created_at ? new Date(inq.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            {inq.inquiry_type === "medicine" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#0071E3]/10 text-[#0071E3]">
                                <Pill className="h-3 w-3" /> Medicine
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-600">
                                <FlaskConical className="h-3 w-3" /> Lab Test
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {inq.patient_name}
                            </span>
                            <span className="text-slate-500 text-[11px] block">
                              📞 {inq.patient_phone}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              📍 {inq.locality}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {inq.target_entity_name}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              📞 {inq.target_entity_phone}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-0.5 max-w-xs">
                              {inq.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="text-slate-700 dark:text-slate-300 font-medium">
                                  • {item.name} (x{item.qty})
                                </div>
                              ))}
                              {inq.items.length > 2 && (
                                <span className="text-[10px] text-[#0071E3] font-semibold">
                                  +{inq.items.length - 2} more items
                                </span>
                              )}
                              <span className="text-[11px] font-bold text-emerald-600 block mt-1">
                                Est. Total: ₹{totalOrderValue}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <select
                              value={inq.status}
                              onChange={(e) => handleUpdateStatus(inq.id, e.target.value as any)}
                              className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                                inq.status === "fulfilled"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : inq.status === "contacted"
                                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                              }`}
                            >
                              <option value="dispatched">WhatsApp Dispatched</option>
                              <option value="contacted">Chemist Contacted</option>
                              <option value="fulfilled">Order Fulfilled</option>
                            </select>
                          </td>

                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <a
                              href={`https://wa.me/${inq.target_entity_phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#25D366] text-white font-bold text-[11px] hover:bg-[#20bd5a]"
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Ping Counter
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* PARTNERS LISTING */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0071E3]/10 text-[#0071E3] uppercase">
                        {partner.partner_type === "pharmacy" ? "Medical Store" : "Diagnostic Lab"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <BadgeCheck className="h-4 w-4" /> Verified Partner
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {partner.business_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Contact: {partner.contact_person}
                    </p>

                    <div className="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                      <div>📍 {partner.address}</div>
                      <div>📜 Reg: {partner.license_number || "Verified"}</div>
                      <div>
                        🛵 Service: {partner.home_service ? "Home Delivery / Collection Active" : "Counter Only"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      📞 {partner.phone}
                    </span>
                    <a
                      href={`https://wa.me/${partner.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#25D366] text-white font-bold text-[11px] hover:bg-[#20bd5a]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Owner
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
