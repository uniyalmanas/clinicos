/**
 * Clinic-local calendar dates.
 *
 * `new Date().toISOString()` is UTC. A clinic in India opens at 09:00 IST,
 * which is 03:30 UTC — but between 00:00 and 05:29 IST the UTC date is still
 * "yesterday". Token allocation, the live queue and the public waiting-room
 * display all key off the appointment date, so using the UTC date would file
 * an early-morning walk-in under the previous day and hide it from every
 * "today" view.
 *
 * Everything that decides "what day is it for the clinic" must use this helper.
 */

export const CLINIC_TIME_ZONE = process.env.CLINIC_TIME_ZONE || "Asia/Kolkata";

const DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLINIC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The clinic-local calendar date as `YYYY-MM-DD`. */
export function clinicToday(now: Date = new Date()): string {
  return DATE_FORMAT.format(now);
}

/** The clinic-local calendar date `days` from today as `YYYY-MM-DD`. */
export function clinicDatePlusDays(days: number, now: Date = new Date()): string {
  return DATE_FORMAT.format(new Date(now.getTime() + days * 86400000));
}
