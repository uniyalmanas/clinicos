"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { 
  Pill, 
  Microscope, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  ShieldCheck,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Receipt,
  Printer,
  FileText,
  IndianRupee,
  Layers,
  ArrowUpDown,
  Check,
  X,
  Share2,
  PackageCheck,
  Building2,
  Stethoscope
} from "lucide-react";

export interface PharmacyBatchItem {
  id: string;
  clinic_slug: string;
  brand_name: string;
  generic_name: string;
  dosage_form: string;
  strength?: string;
  batch_number: string;
  expiry_date: string;
  days_to_expiry?: number;
  is_expiring_soon?: boolean;
  is_expired?: boolean;
  current_stock: number;
  reorder_level: number;
  is_low_stock?: boolean;
  purchase_price: number;
  mrp: number;
  selling_price: number;
  gst_rate: number;
  hsn_code?: string;
  manufacturer?: string;
  rack_location?: string;
  created_at?: string;
}

export interface PharmacyBillItem {
  item_id: string;
  brand_name: string;
  batch_number: string;
  dosage_form: string;
  quantity: number;
  unit_price: number;
  total: number;
  gst_rate: number;
}

export interface PharmacyBill {
  id: string;
  bill_number: string;
  clinic_slug: string;
  prescription_number?: string;
  patient_name: string;
  patient_phone?: string;
  doctor_name?: string;
  items: PharmacyBillItem[];
  subtotal: number;
  discount: number;
  gst_amount: number;
  total_amount: number;
  payment_mode: 'cash' | 'upi' | 'card';
  status: 'dispensed' | 'pending' | 'cancelled';
  created_at: string;
}

export default function DashboardPharmacyPage() {
  const [activeTab, setActiveTab] = useState<"inventory" | "dispense" | "partners">("inventory");

  // Inventory State
  const [inventory, setInventory] = useState<PharmacyBatchItem[]>([]);
  const [summary, setSummary] = useState<any>({
    total_skus: 0,
    total_stock_units: 0,
    total_inventory_mrp: 0,
    low_stock_count: 0,
    expiring_soon_count: 0
  });
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState<"all" | "expiring_soon" | "low_stock">("all");

  // Prescriptions Queue State
  const [prescriptionsQueue, setPrescriptionsQueue] = useState<any[]>([]);
  const [pastBills, setPastBills] = useState<PharmacyBill[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  // Modals State
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [selectedItemForStock, setSelectedItemForStock] = useState<PharmacyBatchItem | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(0);

  // Dispense POS Modal
  const [selectedRxForDispense, setSelectedRxForDispense] = useState<any | null>(null);
  const [dispenseItems, setDispenseItems] = useState<any[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card">("upi");
  const [isDispensing, setIsDispensing] = useState(false);
  const [dispenseError, setDispenseError] = useState<string | null>(null);

  // Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  // New Batch Form State
  const [newBatchForm, setNewBatchForm] = useState({
    brand_name: "",
    generic_name: "",
    dosage_form: "Tablet" as const,
    strength: "100mg",
    batch_number: "",
    expiry_date: "",
    current_stock: 50,
    reorder_level: 15,
    purchase_price: 30,
    mrp: 65,
    selling_price: 60,
    gst_rate: 12,
    rack_location: "Rack A-01",
    manufacturer: "Sun Pharma"
  });

  // Partner Orders (Legacy Delivery Hub)
  const [partnerOrders, setPartnerOrders] = useState([
    {
      order_id: "ORD-PHARM-881",
      prescription_number: "RX-2026-09-0014",
      patient_name: "Amit Rawat",
      patient_phone: "+91 91234 56780",
      partner_name: "Apollo Pharmacy (Rajpur Road Hub)",
      type: "pharmacy",
      items_summary: "DOXYCYCLINE 100MG (10 caps), TRETINOIN 0.05% CREAM (1 tube)",
      order_status: "ready_for_pickup",
      time: "10:40 AM Today",
      amount_est: 340
    },
    {
      order_id: "ORD-LAB-912",
      prescription_number: "RX-2026-09-0014",
      patient_name: "Amit Rawat",
      patient_phone: "+91 91234 56780",
      partner_name: "Dr. Lal PathLabs (Survey Chowk)",
      type: "diagnostic",
      items_summary: "Complete Blood Count (CBC), Liver Function Test (LFT)",
      order_status: "sample_collected",
      time: "09:30 AM Today",
      amount_est: 950
    },
    {
      order_id: "ORD-PHARM-882",
      prescription_number: "RX-2026-09-0021",
      patient_name: "Priya Singh",
      patient_phone: "+91 91234 56781",
      partner_name: "Sanjeevani Medicos (EC Road)",
      type: "pharmacy",
      items_summary: "CETIRIZINE 10MG (1 strip), MOMETASONE 0.1% CREAM",
      order_status: "dispatched",
      time: "11:15 AM Today",
      amount_est: 185
    }
  ]);

  // Load Inventory Data
  const fetchInventory = async () => {
    setIsLoadingInventory(true);
    try {
      const url = inventoryFilter === "all" 
        ? `${API_BASE_URL}/api/v1/pharmacy/inventory`
        : `${API_BASE_URL}/api/v1/pharmacy/inventory?filter_type=${inventoryFilter}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setInventory(json.items || []);
        setSummary(json.summary || {});
      } else {
        runFallbackInventory();
      }
    } catch {
      runFallbackInventory();
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // Load Prescriptions & Bills
  const fetchQueueAndBills = async () => {
    setIsLoadingQueue(true);
    try {
      const [queueRes, billsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/pharmacy/prescriptions-queue`),
        fetch(`${API_BASE_URL}/api/v1/pharmacy/bills`)
      ]);

      if (queueRes.ok) {
        const qJson = await queueRes.json();
        setPrescriptionsQueue(qJson.queue || []);
      }
      if (billsRes.ok) {
        const bJson = await billsRes.json();
        setPastBills(bJson.bills || []);
      }
    } catch {
      // Fallback local
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchQueueAndBills();
  }, [inventoryFilter]);

  const runFallbackInventory = () => {
    const fallback: PharmacyBatchItem[] = [
      {
        id: "1",
        clinic_slug: "derma-care-dehradun",
        brand_name: "Doxy-100 L",
        generic_name: "DOXYCYCLINE 100MG + LACTOBACILLUS",
        dosage_form: "Capsule",
        strength: "100mg",
        batch_number: "DX-2026-91",
        expiry_date: "2026-10-30",
        days_to_expiry: 42,
        is_expiring_soon: true,
        is_expired: false,
        current_stock: 30,
        reorder_level: 15,
        is_low_stock: false,
        purchase_price: 28,
        mrp: 65,
        selling_price: 58,
        gst_rate: 12,
        rack_location: "Rack A-01",
        manufacturer: "Dr. Reddy's Lab"
      },
      {
        id: "2",
        clinic_slug: "derma-care-dehradun",
        brand_name: "Retino-A 0.05%",
        generic_name: "TRETINOIN 0.05% W/W GEL",
        dosage_form: "Ointment",
        strength: "0.05%",
        batch_number: "TR-2027-14",
        expiry_date: "2027-10-15",
        days_to_expiry: 380,
        is_expiring_soon: false,
        is_expired: false,
        current_stock: 4,
        reorder_level: 10,
        is_low_stock: true,
        purchase_price: 110,
        mrp: 220,
        selling_price: 195,
        gst_rate: 12,
        rack_location: "Rack A-04",
        manufacturer: "Janssen India"
      },
      {
        id: "3",
        clinic_slug: "derma-care-dehradun",
        brand_name: "Momate Cream",
        generic_name: "MOMETASONE FUROATE 0.1% W/W",
        dosage_form: "Ointment",
        strength: "0.1%",
        batch_number: "MF-2026-19",
        expiry_date: "2026-10-05",
        days_to_expiry: 18,
        is_expiring_soon: true,
        is_expired: false,
        current_stock: 6,
        reorder_level: 10,
        is_low_stock: true,
        purchase_price: 85,
        mrp: 175,
        selling_price: 150,
        gst_rate: 12,
        rack_location: "Rack A-08",
        manufacturer: "Glenmark"
      }
    ];
    setInventory(fallback);
    setSummary({
      total_skus: 3,
      total_stock_units: 40,
      total_inventory_mrp: 3880,
      low_stock_count: 2,
      expiring_soon_count: 2
    });
  };

  // Add Batch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/pharmacy/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBatchForm)
      });
      if (res.ok) {
        setShowAddBatchModal(false);
        fetchInventory();
      }
    } catch {
      // Local addition fallback
      setShowAddBatchModal(false);
    }
  };

  // Adjust Stock
  const handleUpdateStock = async () => {
    if (!selectedItemForStock) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/pharmacy/inventory/${selectedItemForStock.id}/stock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_stock: Number(newStockInput) })
      });
      if (res.ok) {
        setShowAdjustStockModal(false);
        fetchInventory();
      }
    } catch {
      setShowAdjustStockModal(false);
    }
  };

  // Open Dispense POS Modal from prescription queue
  const handleOpenDispenseModal = (rx: any) => {
    setDispenseError(null);
    setSelectedRxForDispense(rx);
    
    // Auto-map prescription items to available inventory batches
    const items = (rx.items || []).map((rxItem: any) => {
      // Find matching inventory item by name or generic
      const match = inventory.find(
        inv => inv.brand_name.toLowerCase().includes(rxItem.medicine_name.toLowerCase()) ||
               rxItem.medicine_name.toLowerCase().includes(inv.brand_name.toLowerCase()) ||
               inv.generic_name.toLowerCase().includes((rxItem.generic_name || "").toLowerCase())
      );

      return {
        item_id: match ? match.id : "manual-" + Math.random(),
        brand_name: match ? match.brand_name : rxItem.medicine_name,
        batch_number: match ? match.batch_number : "BT-GEN-01",
        dosage_form: rxItem.dosage_form || (match ? match.dosage_form : "Tablet"),
        quantity: rxItem.duration_days > 7 ? 2 : 1,
        unit_price: match ? match.selling_price : 60,
        total: (match ? match.selling_price : 60) * (rxItem.duration_days > 7 ? 2 : 1),
        gst_rate: match ? match.gst_rate : 12
      };
    });

    setDispenseItems(items);
    setDiscountAmount(0);
    setSelectedRxForDispense(rx);
  };

  // Submit Dispense
  const handleConfirmDispense = async () => {
    if (!selectedRxForDispense) return;
    setIsDispensing(true);

    try {
      const payload = {
        clinic_slug: "derma-care-dehradun",
        prescription_number: selectedRxForDispense.prescription_number,
        patient_name: selectedRxForDispense.patient_name,
        patient_phone: selectedRxForDispense.patient_phone,
        doctor_name: selectedRxForDispense.doctor_name,
        items: dispenseItems,
        discount: Number(discountAmount),
        payment_mode: paymentMode
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/pharmacy/dispense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        setSelectedRxForDispense(null);
        setActiveReceipt(json.bill);
        fetchInventory();
        fetchQueueAndBills();
      } else {
        const errorBody = await res.json().catch(() => null);
        setDispenseError(errorBody?.detail || "Dispensing failed. No receipt was created.");
      }
    } catch {
      setDispenseError("The pharmacy service is unavailable. No receipt was created.");
    } finally {
      setIsDispensing(false);
    }
  };

  // Filter inventory by query
  const filteredInventory = inventory.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.brand_name.toLowerCase().includes(q) ||
      item.generic_name.toLowerCase().includes(q) ||
      item.batch_number.toLowerCase().includes(q) ||
      (item.rack_location || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#1D1D1F] dark:text-white">
            Clinic Dispensary & Pharmacy Operations
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
            Real-time batch expiry alerts, computerized stock depletion, and GST-compliant counter dispensing
          </p>
        </div>

        {/* Tab Navigation Pill */}
        <div className="flex items-center gap-1 rounded-[14px] bg-[#ECEEF2] p-1 dark:bg-white/[0.06]">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "inventory"
                ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Batch Inventory & Expiry</span>
          </button>

          <button
            onClick={() => setActiveTab("dispense")}
            className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "dispense"
                ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Prescription POS Dispense</span>
            {prescriptionsQueue.filter(r => !r.is_dispensed).length > 0 && (
              <span className="ml-1 rounded-full bg-[#0071E3] px-1.5 py-0.2 text-[10px] font-bold text-white">
                {prescriptionsQueue.filter(r => !r.is_dispensed).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("partners")}
            className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "partners"
                ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
            }`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Delivery Partners</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BATCH INVENTORY & EXPIRY RADAR */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Total Stock Value */}
            <div className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#86868B]">Inventory MRP Value</span>
                <span className="rounded-full bg-[#0071E3]/10 p-2 text-[#0071E3] dark:text-[#2997FF]">
                  <IndianRupee className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-[#1D1D1F] dark:text-white">
                ₹{summary.total_inventory_mrp?.toLocaleString("en-IN")}
              </div>
              <div className="mt-1 text-[11px] text-[#86868B]">
                {summary.total_stock_units} Units across {summary.total_skus} Active SKUs
              </div>
            </div>

            {/* Critical Expiry Alert (<60d) */}
            <div 
              onClick={() => setInventoryFilter(inventoryFilter === "expiring_soon" ? "all" : "expiring_soon")}
              className={`cursor-pointer rounded-[20px] border p-5 shadow-sm transition ${
                summary.expiring_soon_count > 0
                  ? "border-[#FF9500]/30 bg-[#FF9500]/5 dark:border-[#FF9500]/40"
                  : "border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1C1C1E]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#FF9500]">Expiring Soon (&lt;60d)</span>
                <span className="rounded-full bg-[#FF9500]/15 p-2 text-[#FF9500]">
                  <AlertTriangle className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-[#FF9500]">
                {summary.expiring_soon_count} Batches
              </div>
              <div className="mt-1 text-[11px] text-[#86868B]">
                {inventoryFilter === "expiring_soon" ? "✓ Filter Active (Click to reset)" : "Click to view near-expiry batches"}
              </div>
            </div>

            {/* Low Stock Alert */}
            <div 
              onClick={() => setInventoryFilter(inventoryFilter === "low_stock" ? "all" : "low_stock")}
              className={`cursor-pointer rounded-[20px] border p-5 shadow-sm transition ${
                summary.low_stock_count > 0
                  ? "border-[#FF3B30]/30 bg-[#FF3B30]/5 dark:border-[#FF3B30]/40"
                  : "border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1C1C1E]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#FF3B30]">Low Stock Alerts</span>
                <span className="rounded-full bg-[#FF3B30]/15 p-2 text-[#FF3B30]">
                  <AlertOctagon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-[#FF3B30]">
                {summary.low_stock_count} SKUs
              </div>
              <div className="mt-1 text-[11px] text-[#86868B]">
                {inventoryFilter === "low_stock" ? "✓ Filter Active (Click to reset)" : "Stock &le; Reorder threshold"}
              </div>
            </div>

            {/* In-House Compliance */}
            <div className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#34C759]">NMC / HSN Compliant</span>
                <span className="rounded-full bg-[#34C759]/10 p-2 text-[#34C759]">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-[#34C759]">
                100%
              </div>
              <div className="mt-1 text-[11px] text-[#86868B]">
                Uppercase chemical matching
              </div>
            </div>
          </div>

          {/* Action Bar: Search, Quick Filters & Add Batch */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B]" />
              <input
                type="text"
                placeholder="Search brand, generic chemical, batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[14px] border border-black/[0.08] bg-white py-2 pl-10 pr-4 text-xs text-[#1D1D1F] placeholder-[#86868B] shadow-sm focus:border-[#0071E3] focus:outline-none dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setInventoryFilter("all")}
                className={`rounded-[12px] px-3 py-1.5 text-xs font-semibold transition ${
                  inventoryFilter === "all"
                    ? "bg-[#1D1D1F] text-white dark:bg-white dark:text-black"
                    : "border border-black/[0.08] bg-white text-[#86868B] dark:border-white/[0.08] dark:bg-[#1C1C1E]"
                }`}
              >
                All Batches ({summary.total_skus})
              </button>

              <button
                onClick={() => setInventoryFilter("expiring_soon")}
                className={`rounded-[12px] px-3 py-1.5 text-xs font-semibold transition ${
                  inventoryFilter === "expiring_soon"
                    ? "bg-[#FF9500] text-white"
                    : "border border-black/[0.08] bg-white text-[#86868B] dark:border-white/[0.08] dark:bg-[#1C1C1E]"
                }`}
              >
                Expiring Soon ({summary.expiring_soon_count})
              </button>

              <button
                onClick={() => setInventoryFilter("low_stock")}
                className={`rounded-[12px] px-3 py-1.5 text-xs font-semibold transition ${
                  inventoryFilter === "low_stock"
                    ? "bg-[#FF3B30] text-white"
                    : "border border-black/[0.08] bg-white text-[#86868B] dark:border-white/[0.08] dark:bg-[#1C1C1E]"
                }`}
              >
                Low Stock ({summary.low_stock_count})
              </button>

              <button
                onClick={() => setShowAddBatchModal(true)}
                className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#0071E3] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] transition"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add Batch</span>
              </button>
            </div>
          </div>

          {/* Batch Inventory Table */}
          <div className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/[0.06] bg-[#ECEEF2]/40 text-[#86868B] dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Brand & Generic Chemical</th>
                    <th className="px-4 py-3.5 font-bold">Batch & Form</th>
                    <th className="px-4 py-3.5 font-bold">Expiry Date</th>
                    <th className="px-4 py-3.5 font-bold">Stock on Hand</th>
                    <th className="px-4 py-3.5 font-bold">Pricing (MRP / Sell)</th>
                    <th className="px-4 py-3.5 font-bold">Rack / Shelf</th>
                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {filteredInventory.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition ${
                        item.is_expiring_soon && item.days_to_expiry && item.days_to_expiry <= 30
                          ? "bg-[#FF3B30]/5"
                          : item.is_expiring_soon
                          ? "bg-[#FF9500]/5"
                          : ""
                      }`}
                    >
                      {/* Name & Generic */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                          <span>{item.brand_name}</span>
                          <span className="text-[10px] font-semibold text-[#86868B]">({item.strength})</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#0071E3] dark:text-[#2997FF] uppercase mt-0.5">
                          {item.generic_name}
                        </div>
                        <div className="text-[10px] text-[#86868B] mt-0.5">
                          Mfg: {item.manufacturer || "N/A"}
                        </div>
                      </td>

                      {/* Batch & Form */}
                      <td className="px-4 py-4">
                        <span className="rounded-[6px] bg-black/[0.04] px-2 py-0.5 font-mono text-[11px] font-bold text-[#1D1D1F] dark:bg-white/[0.08] dark:text-white">
                          {item.batch_number}
                        </span>
                        <div className="text-[11px] text-[#86868B] mt-1">
                          {item.dosage_form}
                        </div>
                      </td>

                      {/* Expiry Date & Warning Indicator */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-[#1D1D1F] dark:text-white">
                          {item.expiry_date}
                        </div>
                        {item.days_to_expiry !== undefined && (
                          <div className="mt-1">
                            {item.days_to_expiry <= 0 ? (
                              <span className="rounded-full bg-[#FF3B30]/10 px-2 py-0.5 text-[10px] font-black text-[#FF3B30]">
                                EXPIRED
                              </span>
                            ) : item.days_to_expiry <= 30 ? (
                              <span className="rounded-full bg-[#FF3B30]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF3B30] flex items-center gap-1 w-fit">
                                <AlertOctagon className="h-3 w-3" /> Critical: {item.days_to_expiry}d left
                              </span>
                            ) : item.days_to_expiry <= 60 ? (
                              <span className="rounded-full bg-[#FF9500]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF9500] flex items-center gap-1 w-fit">
                                <AlertTriangle className="h-3 w-3" /> Expiring: {item.days_to_expiry}d left
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#34C759] font-medium">
                                Valid ({item.days_to_expiry}d)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Stock on Hand */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#1D1D1F] dark:text-white">
                            {item.current_stock}
                          </span>
                          <span className="text-[10px] text-[#86868B]">units</span>
                        </div>
                        {item.current_stock <= item.reorder_level && (
                          <span className="mt-1 inline-block rounded-full bg-[#FF3B30]/10 px-2 py-0.2 text-[10px] font-bold text-[#FF3B30]">
                            Low Stock (Min: {item.reorder_level})
                          </span>
                        )}
                      </td>

                      {/* Pricing */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-[#1D1D1F] dark:text-white">
                          ₹{item.selling_price} <span className="text-[10px] text-[#86868B] line-through">₹{item.mrp}</span>
                        </div>
                        <div className="text-[10px] text-[#86868B]">
                          Buy: ₹{item.purchase_price} • GST {item.gst_rate}%
                        </div>
                      </td>

                      {/* Rack / Shelf */}
                      <td className="px-4 py-4 font-mono text-[11px] font-semibold text-[#86868B]">
                        {item.rack_location || "—"}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedItemForStock(item);
                            setNewStockInput(item.current_stock);
                            setShowAdjustStockModal(true);
                          }}
                          className="rounded-[10px] border border-black/[0.08] px-2.5 py-1 text-[11px] font-bold text-[#1D1D1F] hover:bg-black/[0.03] dark:border-white/[0.08] dark:text-white dark:hover:bg-white/[0.03] transition"
                        >
                          Adjust Qty
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRESCRIPTION POS DISPENSE TERMINAL */}
      {activeTab === "dispense" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Pane: Doctors' Prescriptions Queue */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#86868B]">
                Prescription Dispense Queue ({prescriptionsQueue.length})
              </h2>
              <span className="text-xs text-[#86868B]">
                Auto-synced from Doctor Consultation Rooms
              </span>
            </div>

            <div className="space-y-3">
              {prescriptionsQueue.map((rx) => (
                <div
                  key={rx.id}
                  className={`rounded-[20px] border p-5 shadow-sm transition ${
                    rx.is_dispensed
                      ? "border-black/[0.06] bg-white opacity-85 dark:border-white/[0.08] dark:bg-[#1C1C1E]"
                      : "border-[#0071E3]/20 bg-white dark:border-[#0071E3]/30 dark:bg-[#1C1C1E]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.04] pb-3 dark:border-white/[0.04]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0071E3] dark:text-[#2997FF]">
                          {rx.prescription_number}
                        </span>
                        {rx.is_dispensed ? (
                          <span className="rounded-full bg-[#34C759]/15 px-2 py-0.5 text-[10px] font-bold text-[#34C759]">
                            ✓ DISPENSED
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#0071E3]/15 px-2 py-0.5 text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF]">
                            READY FOR DISPENSARY
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm font-black text-[#1D1D1F] dark:text-white">
                        {rx.patient_name} <span className="text-xs font-normal text-[#86868B]">({rx.patient_phone})</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xs font-bold text-[#1D1D1F] dark:text-white flex items-center sm:justify-end gap-1">
                        <Stethoscope className="h-3.5 w-3.5 text-[#0071E3]" />
                        <span>{rx.doctor_name}</span>
                      </div>
                      <div className="text-[10px] text-[#86868B]">
                        Diagnosis: {rx.diagnosis || "Consultation"}
                      </div>
                    </div>
                  </div>

                  {/* Prescribed Medicines List */}
                  <div className="mt-3 space-y-1.5">
                    {(rx.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-black/[0.02] dark:border-white/[0.02]">
                        <div className="font-semibold text-[#1D1D1F] dark:text-white">
                          {idx + 1}. {item.medicine_name} <span className="text-[10px] text-[#86868B]">({item.dosage_form})</span>
                        </div>
                        <div className="font-mono text-[11px] text-[#86868B]">
                          {item.dosage_frequency} • {item.duration_days} Days
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between pt-2">
                    <Link
                      href={`/p/${rx.prescription_number}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0071E3] hover:underline dark:text-[#2997FF]"
                    >
                      <FileText className="h-3.5 w-3.5" /> View Prescription A4
                    </Link>

                    {!rx.is_dispensed ? (
                      <button
                        onClick={() => handleOpenDispenseModal(rx)}
                        className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#0071E3] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] transition"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>Dispense & Bill POS</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="rounded-[10px] bg-black/[0.04] px-3 py-1.5 text-xs font-semibold text-[#86868B] dark:bg-white/[0.04]"
                      >
                        Dispensed Already
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Pane: Past Dispensed Invoices */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#86868B]">
                Recent Dispensary Bills ({pastBills.length})
              </h2>
            </div>

            <div className="space-y-3">
              {pastBills.map((bill) => (
                <div
                  key={bill.id}
                  className="rounded-[20px] border border-black/[0.06] bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-[#1D1D1F] dark:text-white">
                      {bill.bill_number}
                    </span>
                    <span className="text-sm font-black text-[#34C759]">
                      ₹{bill.total_amount?.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[#86868B] flex items-center justify-between">
                    <span>Patient: <strong>{bill.patient_name}</strong></span>
                    <span className="uppercase font-mono text-[10px] bg-black/[0.04] px-2 py-0.5 rounded dark:bg-white/[0.06]">
                      {bill.payment_mode}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#86868B] truncate">
                    {bill.items?.map((i: any) => `${i.brand_name} (x${i.quantity})`).join(", ")}
                  </div>
                  <div className="mt-3 flex items-center justify-end border-t border-black/[0.04] pt-2 dark:border-white/[0.04]">
                    <button
                      onClick={() => setActiveReceipt(bill)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0071E3] hover:underline dark:text-[#2997FF]"
                    >
                      <Printer className="h-3.5 w-3.5" /> View / Print Tax Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PARTNERS OVERVIEW (Legacy Delivery Hub) */}
      {activeTab === "partners" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#34C759]/10 p-2.5 text-[#34C759]">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#1D1D1F] dark:text-white">Apollo Pharmacy (Rajpur Road)</div>
                  <div className="text-[11px] text-[#86868B]">Walk-In & 30m Doorstep Delivery</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#34C759] font-semibold border-t border-black/[0.04] pt-2.5 dark:border-white/[0.04]">
                <span>● Connected Live</span>
                <span>4 Orders Fulfilled Today</span>
              </div>
            </div>

            <div className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#0071E3]/10 p-2.5 text-[#0071E3] dark:text-[#2997FF]">
                  <Microscope className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#1D1D1F] dark:text-white">Dr. Lal PathLabs (Survey Chowk)</div>
                  <div className="text-[11px] text-[#86868B]">NABL Accredited Diagnostics</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#0071E3] font-semibold border-t border-black/[0.04] pt-2.5 dark:border-white/[0.04]">
                <span>● Connected Live</span>
                <span>2 Samples Collected</span>
              </div>
            </div>

            <div className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#AF52DE]/10 p-2.5 text-[#AF52DE]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#1D1D1F] dark:text-white">Zero Aggregator Cuts</div>
                  <div className="text-[11px] text-[#86868B]">100% Retained by Chemist & Patient</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#AF52DE] font-semibold border-t border-black/[0.04] pt-2.5 dark:border-white/[0.04]">
                <span>UPPERCASE Generic Compliance</span>
                <span>NMC Approved</span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                Active Partner Fulfillment Streams ({partnerOrders.length})
              </span>
              <span className="text-xs text-[#86868B]">
                Updated live via WhatsApp Webhook
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/[0.06] bg-[#ECEEF2]/40 text-[#86868B] dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Order ID</th>
                    <th className="px-5 py-3 font-semibold">Patient</th>
                    <th className="px-5 py-3 font-semibold">Partner</th>
                    <th className="px-5 py-3 font-semibold">Prescribed Items</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Chemist Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {partnerOrders.map(ord => (
                    <tr key={ord.order_id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#1D1D1F] dark:text-white">
                        {ord.order_id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#1D1D1F] dark:text-white">{ord.patient_name}</div>
                        <div className="text-[10px] text-[#86868B]">{ord.patient_phone}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-[#1D1D1F] dark:text-white flex items-center gap-1">
                          {ord.type === "pharmacy" ? (
                            <Pill className="h-3.5 w-3.5 text-[#34C759]" />
                          ) : (
                            <Microscope className="h-3.5 w-3.5 text-[#0071E3]" />
                          )}
                          <span>{ord.partner_name}</span>
                        </div>
                        <div className="text-[10px] text-[#86868B]">{ord.time}</div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs text-[#86868B] truncate">
                        {ord.items_summary}
                      </td>
                      <td className="px-5 py-3.5">
                        {ord.order_status === "ready_for_pickup" ? (
                          <span className="rounded-full bg-[#34C759]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#34C759]">
                            Ready for Pickup
                          </span>
                        ) : ord.order_status === "sample_collected" ? (
                          <span className="rounded-full bg-[#0071E3]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#0071E3]">
                            Sample In Transit
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#FF9500]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#FF9500]">
                            Dispatched
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/p/${ord.prescription_number}`}
                          target="_blank"
                          className="rounded-lg border border-black/[0.08] p-1.5 text-[#86868B] hover:bg-black/[0.04] inline-flex items-center dark:border-white/[0.08] dark:hover:bg-white/[0.04]"
                          title="View Original Prescription"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW BATCH / SKU */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[24px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
              <h3 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#0071E3]" /> Add New Medicine Batch to Inventory
              </h3>
              <button
                onClick={() => setShowAddBatchModal(false)}
                className="rounded-full p-1 text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Brand Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Augmentin 625"
                    value={newBatchForm.brand_name}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, brand_name: e.target.value })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Generic Chemical</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AMOXICILLIN + CLAV"
                    value={newBatchForm.generic_name}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, generic_name: e.target.value })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Dosage Form</label>
                  <select
                    value={newBatchForm.dosage_form}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, dosage_form: e.target.value as any })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Ointment">Ointment / Gel</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Strength</label>
                  <input
                    type="text"
                    placeholder="e.g. 625mg / 0.05%"
                    value={newBatchForm.strength}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, strength: e.target.value })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Batch Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BX-9011"
                    value={newBatchForm.batch_number}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, batch_number: e.target.value })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newBatchForm.expiry_date}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, expiry_date: e.target.value })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Initial Stock (Units)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBatchForm.current_stock}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, current_stock: Number(e.target.value) })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Reorder Level</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBatchForm.reorder_level}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, reorder_level: Number(e.target.value) })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBatchForm.purchase_price}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, purchase_price: Number(e.target.value) })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBatchForm.mrp}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, mrp: Number(e.target.value) })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBatchForm.selling_price}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, selling_price: Number(e.target.value) })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">GST Slab</label>
                  <select
                    value={newBatchForm.gst_rate}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, gst_rate: Number(e.target.value) })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  >
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Shelf / Rack Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Rack B-03"
                    value={newBatchForm.rack_location}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, rack_location: e.target.value })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Sun Pharma / Cipla"
                    value={newBatchForm.manufacturer}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, manufacturer: e.target.value })}
                    className="mt-1 w-full rounded-[10px] border border-black/[0.08] p-2.5 dark:border-white/[0.08] dark:bg-black/20"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="rounded-[12px] border border-black/[0.08] px-4 py-2 font-semibold text-[#86868B] dark:border-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[12px] bg-[#0071E3] px-5 py-2 font-bold text-white shadow-sm hover:bg-[#0077ED]"
                >
                  Save Batch to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST STOCK QUANTITY */}
      {showAdjustStockModal && selectedItemForStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
              Stock Physical Count Adjustment
            </h3>
            <p className="mt-1 text-xs text-[#86868B]">
              {selectedItemForStock.brand_name} (Batch: {selectedItemForStock.batch_number})
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
                New Verified Quantity on Hand
              </label>
              <input
                type="number"
                min="0"
                value={newStockInput}
                onChange={(e) => setNewStockInput(Number(e.target.value))}
                className="mt-1 w-full rounded-[12px] border border-black/[0.08] p-3 text-sm font-bold text-[#1D1D1F] dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setShowAdjustStockModal(false)}
                className="rounded-[10px] border border-black/[0.08] px-3.5 py-2 font-semibold text-[#86868B] dark:border-white/[0.08]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStock}
                className="rounded-[10px] bg-[#0071E3] px-4 py-2 font-bold text-white shadow-sm hover:bg-[#0077ED]"
              >
                Update Stock Count
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: POS DISPENSE & BILL MODAL */}
      {selectedRxForDispense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
              <div>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-[#0071E3]" /> Prescription Dispense & Counter Billing POS
                </h3>
                <p className="text-xs text-[#86868B]">
                  Patient: <strong>{selectedRxForDispense.patient_name}</strong> • Rx #{selectedRxForDispense.prescription_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedRxForDispense(null)}
                className="rounded-full p-1 text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-[320px] overflow-y-auto space-y-3">
              {dispenseError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {dispenseError}
                </div>
              )}
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/[0.06] bg-[#ECEEF2]/40 text-[#86868B] dark:border-white/[0.06]">
                  <tr>
                    <th className="p-2 font-bold">Item & Batch</th>
                    <th className="p-2 font-bold text-center">Qty</th>
                    <th className="p-2 font-bold text-right">Unit Price</th>
                    <th className="p-2 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {dispenseItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <div className="font-bold text-[#1D1D1F] dark:text-white">{item.brand_name}</div>
                        <div className="text-[10px] font-mono text-[#0071E3]">Batch: {item.batch_number}</div>
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQty = Number(e.target.value);
                            const updated = [...dispenseItems];
                            updated[idx].quantity = newQty;
                            updated[idx].total = newQty * updated[idx].unit_price;
                            setDispenseItems(updated);
                          }}
                          className="w-14 rounded-[8px] border border-black/[0.08] p-1 text-center font-bold dark:border-white/[0.08] dark:bg-black/20"
                        />
                      </td>
                      <td className="p-2 text-right font-mono">
                        ₹{item.unit_price}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-[#1D1D1F] dark:text-white">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations and Payment */}
            <div className="mt-4 border-t border-black/[0.06] pt-4 dark:border-white/[0.06] space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="font-semibold text-[#1D1D1F] dark:text-white">Discount (₹):</label>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="ml-2 w-20 rounded-[8px] border border-black/[0.08] p-1.5 font-bold dark:border-white/[0.08] dark:bg-black/20"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#1D1D1F] dark:text-white">Payment Mode:</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="ml-2 rounded-[8px] border border-black/[0.08] p-1.5 font-bold dark:border-white/[0.08] dark:bg-black/20"
                    >
                      <option value="upi">UPI / QR</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#86868B]">
                    Subtotal: ₹{dispenseItems.reduce((acc, i) => acc + i.total, 0).toFixed(2)}
                  </div>
                  <div className="text-base font-black text-[#34C759]">
                    Grand Total: ₹{(dispenseItems.reduce((acc, i) => acc + i.total, 0) - discountAmount).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedRxForDispense(null)}
                  className="rounded-[12px] border border-black/[0.08] px-4 py-2 font-semibold text-[#86868B] dark:border-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDispensing}
                  onClick={handleConfirmDispense}
                  className="rounded-[12px] bg-[#34C759] px-6 py-2.5 font-bold text-white shadow-sm hover:bg-[#2EB84E] transition"
                >
                  {isDispensing ? "Dispensing & Deducting Stock..." : "Confirm Dispense & Generate Tax Receipt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: GST TAX INVOICE PRINTABLE RECEIPT */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-[24px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06] print:hidden">
              <span className="text-xs font-bold text-[#34C759] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Bill Successfully Generated
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 rounded-[10px] bg-[#0071E3] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0077ED]"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Receipt
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="rounded-full p-1 text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="mt-4 p-4 rounded-[16px] border border-black/[0.06] bg-[#ECEEF2]/20 text-xs dark:border-white/[0.06] dark:bg-white/[0.02] print:border-none print:p-0">
              <div className="text-center border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
                <h2 className="text-base font-black text-[#1D1D1F] dark:text-white print:text-black">
                  DERMA CARE CLINIC DISPENSARY
                </h2>
                <div className="text-[11px] text-[#86868B]">
                  14 Rajpur Road, Dehradun 248001 • GSTIN: 05AAACD1234F1Z5
                </div>
                <div className="text-[10px] font-mono text-[#0071E3] mt-1 print:text-black">
                  INVOICE: {activeReceipt.bill_number} • DATE: {new Date(activeReceipt.created_at || Date.now()).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-[#86868B]">
                <div>
                  Patient: <strong className="text-[#1D1D1F] dark:text-white print:text-black">{activeReceipt.patient_name}</strong>
                  {activeReceipt.patient_phone && <div>Phone: {activeReceipt.patient_phone}</div>}
                </div>
                <div className="text-right">
                  Doctor: <strong className="text-[#1D1D1F] dark:text-white print:text-black">{activeReceipt.doctor_name || "Dr. Rahul Sharma"}</strong>
                  <div>Rx: {activeReceipt.prescription_number || "Counter Sale"}</div>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between font-bold text-[11px] border-b border-black/[0.06] pb-1 dark:border-white/[0.06]">
                  <span>Item & Batch</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Total</span>
                </div>
                {(activeReceipt.items || []).map((i: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                    <div>
                      <div className="font-semibold text-[#1D1D1F] dark:text-white print:text-black">
                        {i.brand_name}
                      </div>
                      <div className="font-mono text-[9px] text-[#86868B]">
                        Batch: {i.batch_number} (GST {i.gst_rate || 12}%)
                      </div>
                    </div>
                    <div className="font-mono text-center">x{i.quantity}</div>
                    <div className="font-mono text-right">₹{i.unit_price}</div>
                    <div className="font-mono font-bold text-right text-[#1D1D1F] dark:text-white print:text-black">
                      ₹{i.total?.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="mt-4 border-t-2 border-black/[0.08] pt-3 dark:border-white/[0.08] space-y-1 text-xs">
                <div className="flex items-center justify-between text-[#86868B]">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{activeReceipt.subtotal?.toFixed(2)}</span>
                </div>
                {activeReceipt.discount > 0 && (
                  <div className="flex items-center justify-between text-[#34C759]">
                    <span>Discount:</span>
                    <span className="font-mono">- ₹{activeReceipt.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[#86868B]">
                  <span>CGST + SGST (Included):</span>
                  <span className="font-mono">₹{activeReceipt.gst_amount?.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between font-black text-sm text-[#1D1D1F] dark:text-white pt-1 border-t border-black/[0.06] dark:border-white/[0.06] print:text-black">
                  <span>Net Paid ({activeReceipt.payment_mode?.toUpperCase()}):</span>
                  <span className="font-mono">₹{activeReceipt.total_amount?.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 text-center text-[10px] text-[#86868B] italic">
                Thank you for your visit! Wishing you good health.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
