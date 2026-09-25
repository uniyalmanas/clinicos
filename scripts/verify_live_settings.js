async function testLive() {
  console.log("Testing Live Vercel Production Settings API & Page...");
  const res = await fetch("https://medic-sept-2026.vercel.app/api/clinics?slug=derma-care-dehradun");
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Clinic Name:", data.name);
  console.log("Tariff Versions count:", data.tariff_versions?.length);
  if (data.tariff_versions && data.tariff_versions.length > 0) {
    console.log("Active Tariff:", data.tariff_versions[0]);
  }
  console.log("Shift Guardrails count:", data.shift_guardrails?.length);
  console.log("Doctors count:", data.doctors?.length);

  const pageRes = await fetch("https://medic-sept-2026.vercel.app/dashboard/settings");
  console.log("Settings Page HTTP Status:", pageRes.status);
}

testLive().catch(console.error);
