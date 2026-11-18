/**
 * Where each role lands after sign-in.
 *
 * The database stores the pharmacist and lab technician as generic `staff`
 * members, so the UI cannot infer a department from the role alone. Staff land
 * on the reception command centre and switch to Pharmacy or Laboratory from the
 * sidebar, which is allowlisted for them.
 */
export function roleHome(roleRaw: string | null | undefined): string {
  const role = String(roleRaw || "").toLowerCase().trim();
  if (role === "super_admin" || role === "superadmin") return "/superadmin";
  if (role === "pharmacist") return "/dashboard/pharmacy";
  if (role === "lab_tech") return "/dashboard/lab";
  if (role === "receptionist" || role === "front_desk" || role === "staff") {
    return "/dashboard/reception";
  }
  if (role === "patient") return "/patient/portal";
  return "/dashboard/today";
}
