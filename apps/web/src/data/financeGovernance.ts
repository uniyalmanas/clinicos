/**
 * Finance Governance Specification & Helper Utilities
 * Clinic Cashflow & Real Net Profit Ledger
 * 
 * Implements:
 * - Fix 1: Expense Voucher Approval & OCR Validation (>₹500 Manager PIN)
 * - Fix 2: Visiting Doctor Payout Splits, Escrow Disputes & Reversals
 * - Fix 3: Multi-Shift Cash Drawer Reconciliation with Variance Tolerance (>₹100 POS Lock)
 * - Fix 4: Floating Petty Cash Reserve Management (<₹800 Alert)
 */

export interface ExpenseVoucher {
  id: string;
  clinic_slug: string;
  title: string;
  category: string;
  amount: number;
  payment_mode: "cash" | "upi";
  recorded_by: string;
  date: string;
  requires_approval: boolean;
  approval_status: "APPROVED" | "PENDING_APPROVAL" | "REJECTED";
  approved_by?: string | null;
  manager_pin_verified: boolean;
  receipt_url?: string;
  ocr_scanned_amt?: number;
  ocr_vendor?: string;
  ocr_verified: boolean;
  duplicate_flag: boolean;
}

export interface DoctorPayout {
  id: string;
  doctor_slug: string;
  doctor_name: string;
  specialty: string;
  roster_type: "in_house" | "visiting";
  roster_label: string;
  schedule: string;
  split_percentage: number;
  clinic_percentage: number;
  patients_seen: number;
  consultation_fee: number;
  gross_collections: number;
  doctor_share: number;
  clinic_share: number;
  consumables_deduction: number;
  next_day_refund_adjustment: number;
  escrow_disputed_amount: number;
  net_payable: number;
  status: "settled" | "pending" | "disputed_escrow" | "locked_day_close";
  payment_mode: string;
  has_dispute: boolean;
  dispute_details?: any;
  closing_sms: string;
  whatsapp_url: string;
}

export interface ShiftHandover {
  id: string;
  clinic_slug: string;
  shift_name: string;
  shift_date: string;
  cashier_name: string;
  next_cashier_name: string;
  opening_float: number;
  cash_inflow: number;
  cash_expenses: number;
  expected_cash: number;
  counted_cash: number;
  variance: number;
  variance_pct: number;
  variance_status: "BALANCED" | "TOLERABLE_VARIANCE" | "VARIANCE_BREACH" | "VARIANCE_AUTHORIZED";
  is_pos_locked: boolean;
  variance_reason: string;
  manager_override_pin?: string;
  manager_override_by?: string;
  handover_status: string;
  created_at: string;
}

export interface PettyCashFloat {
  id: string;
  target_float: number;
  current_balance: number;
  min_threshold: number;
  status: "HEALTHY" | "LOW_FLOAT_ALERT" | "DEPLETED";
  is_low_float: boolean;
  last_replenished_at: string;
  last_replenished_by: string;
}

export interface DenominationBreakdown {
  n500: number;
  n200: number;
  n100: number;
  n50: number;
  n20: number;
  n10: number;
  coins: number;
}

export function calculateDenominationTotal(d: DenominationBreakdown): number {
  return (
    d.n500 * 500 +
    d.n200 * 200 +
    d.n100 * 100 +
    d.n50 * 50 +
    d.n20 * 20 +
    d.n10 * 10 +
    d.coins
  );
}

export const MANAGER_PIN_DEFAULT = "4491";

export const VARIANCE_THRESHOLD_INR = 100;
export const VARIANCE_THRESHOLD_PCT = 1.0;
export const EXPENSE_APPROVAL_THRESHOLD_INR = 500;
export const PETTY_CASH_MIN_THRESHOLD_INR = 800;
