async function testActions() {
  console.log("Testing POST actions on Live Vercel Production...");

  // 1. Test Chamber Conflict Detection
  const conflictRes = await fetch("https://medic-sept-2026.vercel.app/api/clinics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "save_shift_guardrail",
      clinic_slug: "derma-care-dehradun",
      chamber_name: "Chamber 1 - OPD Main",
      doctor_slug: "dr-vikram-sethi", // Different doctor trying to double-book Chamber 1 Morning OPD
      doctor_name: "Dr. Vikram Sethi",
      shift_name: "Morning OPD",
      start_time: "10:00 AM",
      end_time: "02:00 PM"
    })
  });

  console.log("Conflict Test HTTP Status:", conflictRes.status);
  const conflictData = await conflictRes.json();
  console.log("Conflict Response:", conflictData);

  // 2. Test PIN Verification on Tariff Version
  const pinFailRes = await fetch("https://medic-sept-2026.vercel.app/api/clinics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "version_tariff",
      clinic_slug: "derma-care-dehradun",
      manager_pin: "0000",
      change_reason: "Test unauthorized"
    })
  });
  console.log("PIN Fail Status (Expected 401):", pinFailRes.status);
}

testActions().catch(console.error);
