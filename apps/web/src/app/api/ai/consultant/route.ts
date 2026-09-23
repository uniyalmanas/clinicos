import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const SYSTEM_PROMPT = `You are DocSphere's Clinical Care & Appointment Consultant for patients in Dehradun, Uttarakhand.
Your goal is to be a warm, helpful, medically grounded assistant that performs 3 key tasks for the patient:
1. **Symptom Triage & Specialty Suggestion**: Analyze symptoms, explain what kind of specialist they should see (e.g. Dermatology, Dentistry, Pediatrics, Orthopedics, ENT, General Physician, Gynecology, Cardiology), and highlight any emergency red flags.
2. **Visit Planning**: Tell the patient what to expect, pre-visit checklist, medication list advice, and explain that DocSphere verified clinics in Dehradun offer transparent direct fees (₹400 - ₹600), live counter token tracking, and 0% markup.
3. **Doctor Recommendation & Booking**: Recommend the best matched verified doctor from our Dehradun network:
   - **Dr. Rahul Sharma**: MD (Dermatology), Derma Care Skin & Laser (14, Rajpur Road, Dehradun), Fee: ₹600. Specializes in acne, skin rashes, psoriasis, hair fall, laser.
   - **Dr. Aditi Joshi**: MDS (Endodontics & Dental Surgery), Smile Craft Dental (42, EC Road, Dehradun), Fee: ₹400. Specializes in toothache, root canal, dental caries, braces, implants.
   - **Dr. Vikram Sethi**: DNB (Pediatrics), Dron Child & Newborn (88, Chakrata Road, Dehradun), Fee: ₹500. Specializes in infant care, fever, vaccinations, colic.
   - **Dr. Priya Bansal**: MS (ENT), Bansal ENT Centre (Haridwar Road, Dehradun), Fee: ₹500. Specializes in ear pain, sinus, throat infections, vertigo.
   - **Dr. Harish K C**: MD (General Medicine), Doon Medicare (Near Clock Tower, Dehradun), Fee: ₹400. Specializes in fever, diabetes, hypertension, viral infections.
   - **Dr. Rohit Sureka**: MS, MCh (Orthopaedics), Sureka Bone & Joint (Ballupur Chowk, Dehradun), Fee: ₹600. Specializes in joint pain, knee pain, fractures, spine.

Keep your response concise, empathetic, and under 120 words.
At the end of your response, ALWAYS output this exact JSON block for the best-matching doctor:
\`\`\`doctor_card
{
  "doctor_name": "Dr. Rahul Sharma",
  "specialization": "MD Dermatology",
  "slug": "dr-rahul-sharma",
  "fee": 600,
  "clinic_name": "Derma Care Skin & Laser",
  "address": "14, Rajpur Road, Dehradun",
  "booking_url": "/book?doctor=dr-rahul-sharma"
}
\`\`\`
Valid slugs: dr-rahul-sharma, dr-aditi-joshi, dr-vikram-sethi, dr-priya-bansal, dr-harish-k-c, dr-rohit-sureka.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-6).map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: String(h.content)
      })),
      { role: "user", content: message }
    ];

    // Attempt Groq API with qwen/qwen3.8-27b or openai/gpt-oss-20b
    let reply = "";
    let doctorCard: any = null;

    if (GROQ_API_KEY) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages,
            max_tokens: 600,
            temperature: 0.3
          })
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          reply = data.choices?.[0]?.message?.content || "";
        } else {
          // Fallback to secondary model
          const fallbackRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-20b",
              messages,
              max_tokens: 600,
              temperature: 0.3
            })
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            reply = fallbackData.choices?.[0]?.message?.content || "";
          }
        }
      } catch (err) {
        console.warn("Groq request failed, using clinical fallback engine:", err);
      }
    }

    // Clinical rule-based fallback if Groq failed or offline
    if (!reply) {
      const lower = message.toLowerCase();
      if (lower.includes("tooth") || lower.includes("dental") || lower.includes("gum") || lower.includes("teeth")) {
        reply = `For dental discomfort, cavity, or gum bleeding, we recommend consulting an Endodontist / Dental Surgeon. In Dehradun, **Dr. Aditi Joshi** at Smile Craft Dental on EC Road provides immediate painless cavity care and live token booking.

\`\`\`doctor_card
{
  "doctor_name": "Dr. Aditi Joshi",
  "specialization": "MDS Endodontics & Dental Surgery",
  "slug": "dr-aditi-joshi",
  "fee": 400,
  "clinic_name": "Smile Craft Dental",
  "address": "42, EC Road, Near Survey Chowk, Dehradun",
  "booking_url": "/book?doctor=dr-aditi-joshi"
}
\`\`\``;
      } else if (lower.includes("skin") || lower.includes("rash") || lower.includes("acne") || lower.includes("hair") || lower.includes("itch")) {
        reply = `For skin rashes, allergic dermatitis, or hair concerns, a qualified Dermatologist is recommended. In Dehradun, **Dr. Rahul Sharma** at Derma Care (Rajpur Road) specializes in dermatological diagnostics and digital prescription management.

\`\`\`doctor_card
{
  "doctor_name": "Dr. Rahul Sharma",
  "specialization": "MD Dermatology, Venereology & Leprosy",
  "slug": "dr-rahul-sharma",
  "fee": 600,
  "clinic_name": "Derma Care Skin & Laser",
  "address": "14, Rajpur Road, Ashley Hall, Dehradun",
  "booking_url": "/book?doctor=dr-rahul-sharma"
}
\`\`\``;
      } else if (lower.includes("child") || lower.includes("baby") || lower.includes("fever") && lower.includes("kid")) {
        reply = `For pediatric issues, fevers in children, or vaccinations, consult a Pediatrician. In Dehradun, **Dr. Vikram Sethi** at Dron Child & Newborn Clinic (Chakrata Road) provides dedicated neonatal and child OPD care.

\`\`\`doctor_card
{
  "doctor_name": "Dr. Vikram Sethi",
  "specialization": "DNB Pediatrics & Neonatology",
  "slug": "dr-vikram-sethi",
  "fee": 500,
  "clinic_name": "Dron Child & Newborn",
  "address": "88, Chakrata Road, Ballupur, Dehradun",
  "booking_url": "/book?doctor=dr-vikram-sethi"
}
\`\`\``;
      } else {
        reply = `Hello! Based on your symptoms, a consultation with a General Physician is the best first step. **Dr. Harish K C** at Doon Medicare near Clock Tower evaluates acute illnesses, fevers, and health parameters with direct zero-markup consultation.

\`\`\`doctor_card
{
  "doctor_name": "Dr. Harish K C",
  "specialization": "MD General Medicine",
  "slug": "dr-harish-k-c",
  "fee": 400,
  "clinic_name": "Doon Medicare Clinic",
  "address": "Near Clock Tower, Rajpur Road, Dehradun",
  "booking_url": "/book?doctor=dr-harish-k-c"
}
\`\`\``;
      }
    }

    // Extract doctor_card JSON if present
    const cardMatch = reply.match(/```doctor_card\s*([\s\S]*?)\s*```/);
    if (cardMatch && cardMatch[1]) {
      try {
        doctorCard = JSON.parse(cardMatch[1].trim());
        // Clean out the raw json block from user display text
        reply = reply.replace(/```doctor_card[\s\S]*?```/, "").trim();
      } catch (e) {
        // card parse error
      }
    }

    return NextResponse.json({
      reply,
      doctorCard
    });
  } catch (error: any) {
    console.error("AI Consultant API error:", error);
    return NextResponse.json(
      { error: "Failed to process consultation request" },
      { status: 500 }
    );
  }
}
