/**
 * Resolve which doctor record belongs to the signed-in account.
 *
 * This is deliberately strict. It used to fall back to `doctors[0]`, which
 * meant an unlinked doctor login would silently open another doctor's chamber
 * and sign prescriptions under the wrong name.
 *
 * Order of evidence:
 *   1. `doctors.user_id` — the authoritative account link.
 *   2. `doctors.phone`  — same 10-digit mobile as the login (older records).
 *   3. Exact full-name match, only when exactly one doctor has that name.
 *
 * Returns `null` when the identity cannot be established.
 */
export type DoctorAccountLike = {
  id?: string | null;
  phone?: string | null;
  full_name?: string | null;
};

export type DoctorRecordLike = {
  user_id?: string | null;
  phone?: string | null;
  full_name?: string | null;
};

const last10 = (value: unknown) =>
  String(value ?? "").replace(/[^0-9]/g, "").slice(-10);

const normalizedName = (value: unknown) =>
  String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export function resolveSignedInDoctor<D extends DoctorRecordLike>(
  account: DoctorAccountLike | null | undefined,
  doctors: D[] | null | undefined
): D | null {
  if (!account || !Array.isArray(doctors) || doctors.length === 0) return null;

  const accountId = String(account.id ?? "").trim();
  if (accountId) {
    const byLink = doctors.find(
      (d) => d.user_id && String(d.user_id).trim() === accountId
    );
    if (byLink) return byLink;
  }

  const accountPhone = last10(account.phone);
  if (accountPhone.length === 10) {
    const byPhone = doctors.find((d) => last10(d.phone) === accountPhone);
    if (byPhone) return byPhone;
  }

  const accountName = normalizedName(account.full_name);
  if (accountName) {
    const byName = doctors.filter(
      (d) => normalizedName(d.full_name) === accountName
    );
    if (byName.length === 1) return byName[0];
  }

  return null;
}
