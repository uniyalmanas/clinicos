/**
 * Read the signed-in staff profile cached by the login flow.
 *
 * UI forms that must attribute an action (amendment, discharge order, expense
 * voucher) use this instead of inventing a name. The server remains the source
 * of truth for authorization; this only stops the UI from writing a fabricated
 * doctor or staff member into an audit field.
 */
export type StoredUser = {
  id?: string;
  full_name?: string;
  role?: string;
  phone?: string;
  clinic_id?: string;
  clinic_slug?: string;
  clinic_name?: string;
};

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("clinicos_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as StoredUser) : null;
  } catch {
    return null;
  }
}

export function storedUserName(): string {
  return getStoredUser()?.full_name?.trim() || "";
}
