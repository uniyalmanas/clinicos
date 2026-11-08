import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

type DoctorRow = {
  slug: string;
  full_name: string;
  specialization: string | null;
  qualification_summary: string | null;
  consultation_fee: string | number | null;
  clinic_name: string | null;
  clinic_address: string | null;
};

const SPECIALTY_KEYWORDS: Array<{ match: string[]; specialty: string[] }> = [
  {
    match: ["tooth", "dental", "gum", "teeth", "cavity", "root canal"],
    specialty: ["dent"],
  },
  {
    match: ["skin", "rash", "acne", "hair", "itch", "psoriasis", "derma"],
    specialty: ["dermat"],
  },
  {
    match: ["child", "baby", "kid", "pediatric", "vaccin", "newborn"],
    specialty: ["pediatric", "paediatric"],
  },
  {
    match: ["physio", "rehab", "joint pain", "back pain", "knee", "shoulder", "mobility"],
    specialty: ["physio", "rehab"],
  },
];

function buildDoctorCard(doc: DoctorRow) {
  return {
    doctor_name: doc.full_name,
    specialization: doc.specialization || "General Physician",
    qualification: doc.qualification_summary || null,
    slug: doc.slug,
    fee: Number(doc.consultation_fee) || null,
    clinic_name: doc.clinic_name || null,
    address: doc.clinic_address || null,
    booking_url: `/book?doctor=${encodeURIComponent(doc.slug)}`,
  };
}

function pickDoctor(message: string, doctors: DoctorRow[]): DoctorRow | null {
  if (doctors.length === 0) return null;
  const lower = message.toLowerCase();

  for (const rule of SPECIALTY_KEYWORDS) {
    if (!rule.match.some((k) => lower.includes(k))) continue;
    const hit = doctors.find((d) =>
      rule.specialty.some((s) => String(d.specialization || "").toLowerCase().includes(s))
    );
    if (hit) return hit;
  }

  return doctors[0];
}

export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit(rateLimitKey(req, "ai:consultant"), 30, 900);
    if (!limit.allowed) {
      return NextResponse.json(tooManyRequests(limit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const body = await req.json();
    const { message } = body;
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message is too long. Please keep it under 2000 characters." },
        { status: 400 }
      );
    }

    // Recommend real, verified doctors from the platform instead of a
    // hard-coded list. The card is always verifiable against the database.
    const doctors = (await db`
      SELECT slug, full_name, specialization, qualification_summary,
             consultation_fee, clinic_name, clinic_address
      FROM doctors
      WHERE is_active = true
        AND verification_status = 'verified'
      ORDER BY rating DESC NULLS LAST, full_name ASC
      LIMIT 40;
    `) as DoctorRow[];

    const doctorList = doctors
      .map(
        (d) =>
          `- ${d.full_name} (${d.specialization || "General"}); ${d.clinic_name || "Clinic"}; fee ₹${Number(d.consultation_fee) || "—"}; slug ${d.slug}`
      )
      .join("\n");

    const systemPrompt = `You are DocSphere's Clinical Care & Appointment Consultant for patients in India.
Your goal is to be a warm, helpful, medically grounded assistant that performs 3 tasks:
1. Symptom triage & specialty suggestion: analyse symptoms, explain which specialist is appropriate, and highlight emergency red flags (chest pain, stroke signs, severe bleeding, breathing difficulty) with advice to seek emergency care immediately.
2. Visit planning: explain what to expect, a pre-visit checklist, medication-list advice, and mention transparent direct fees, live token tracking and 0% markup.
3. Doctor recommendation: recommend the best-matching verified doctor from this live platform list. Use only these doctors and only these exact slugs:
${doctorList || "- No verified doctors are currently listed."}

Keep the response concise, empathetic and under 120 words.
At the end, ALWAYS output one doctor-card JSON block for the best-matching doctor:
\`\`\`doctor_card
{
  "doctor_name": "...",
  "specialization": "...",
  "slug": "...",
  "fee": 0,
  "clinic_name": "...",
  "address": "...",
  "booking_url": "/book?doctor=..."
}
\`\`\``;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6).map((h: any) => ({
        role: h?.role === "user" ? "user" : "assistant",
        content: String(h?.content ?? "").slice(0, 2000),
      })),
      { role: "user", content: message },
    ];

    let reply = "";

    if (GROQ_API_KEY) {
      for (const model of ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"]) {
        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages,
              max_tokens: 600,
              temperature: 0.3,
            }),
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            reply = data.choices?.[0]?.message?.content || "";
            if (reply) break;
          }
        } catch (err) {
          console.warn(`Groq model ${model} failed:`, err);
        }
      }
    }

    // Rule-based fallback when Groq is unavailable.
    if (!reply) {
      const doc = pickDoctor(message, doctors);
      if (!doc) {
        reply =
          "I can help you choose the right specialist, but no verified doctors are currently listed on the platform. Please try again shortly or contact the clinic reception.";
      } else {
        const card = buildDoctorCard(doc);
        reply = `Based on what you described, a consultation with **${doc.full_name}** (${doc.specialization || "General Medicine"}) is a good next step${
          doc.clinic_name ? ` at ${doc.clinic_name}` : ""
        }. Book a token online to see live queue status and the transparent consultation fee. If you have chest pain, severe breathlessness, or sudden weakness, please seek emergency care immediately.

\`\`\`doctor_card
${JSON.stringify(card, null, 2)}
\`\`\``;
      }
    }

    let doctorCard: any = null;
    const cardMatch = reply.match(/```doctor_card\s*([\s\S]*?)\s*```/);
    if (cardMatch && cardMatch[1]) {
      try {
        doctorCard = JSON.parse(cardMatch[1].trim());
        reply = reply.replace(/```doctor_card[\s\S]*?```/, "").trim();
      } catch {
        /* leave the raw reply intact on malformed card JSON */
      }
    }

    // If the model returned an unknown slug, fall back to a verified DB doctor.
    if (doctorCard?.slug) {
      const match = doctors.find((d) => d.slug === doctorCard.slug);
      doctorCard = match ? { ...buildDoctorCard(match), ...doctorCard } : null;
    }

    return NextResponse.json({ reply, doctorCard });
  } catch (error: any) {
    console.error("AI Consultant API error:", error);
    return NextResponse.json(
      { error: "Failed to process consultation request." },
      { status: 500 }
    );
  }
}
