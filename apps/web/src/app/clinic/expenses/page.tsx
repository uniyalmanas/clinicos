import { redirect } from "next/navigation";

/**
 * Legacy route. Expense vouchers are managed in the unified finance workspace
 * (they always were the same `/api/expenses` records).
 */
export default function ClinicExpensesRedirect() {
  redirect("/dashboard/finance");
}
