import { redirect } from "next/navigation";

/**
 * Legacy route. Shift settlement, cash handover and expense vouchers are all
 * part of the unified finance workspace now, so old bookmarks land there.
 */
export default function ClinicSettlementRedirect() {
  redirect("/dashboard/finance");
}
