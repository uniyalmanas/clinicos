import { DEHRADUN_CLINICS } from "@/data/clinics";
import { DEHRADUN_DOCTORS } from "@/data/doctors";

/**
 * Demo fixtures are a development aid, never a production fallback.
 *
 * They are only served when BOTH conditions hold:
 *   - the runtime is not production, and
 *   - ALLOW_DEMO_DATA is explicitly set to "true".
 *
 * Any API route that wants to surface fixtures on a database outage must call
 * `demoDataAllowed()` and otherwise fail closed with a 503.
 */
export function demoDataAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DEMO_DATA === "true"
  );
}

export function getDemoDoctors() {
  return DEHRADUN_DOCTORS;
}

export function getDemoClinics() {
  return DEHRADUN_CLINICS;
}
