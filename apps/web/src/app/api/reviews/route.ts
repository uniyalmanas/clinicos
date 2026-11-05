import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { apiError } from "@/lib/api-auth";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public doctor reviews.
 *
 * The `reviews` table is part of the managed schema, so this route never runs
 * DDL at request time. Reviews are public non-PHI fields; a reviewer is marked
 * verified only when a completed appointment matches the doctor.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorSlug = searchParams.get("doctor_slug") || "";

    const reviews = doctorSlug
      ? await sql`
          SELECT r.*, r.is_verified_visit AS verified_patient
          FROM reviews r
          WHERE lower(r.doctor_slug) = ${doctorSlug.toLowerCase().trim()}
          ORDER BY r.created_at DESC
          LIMIT 50;
        `
      : await sql`
          SELECT r.*, r.is_verified_visit AS verified_patient
          FROM reviews r
          ORDER BY r.created_at DESC
          LIMIT 50;
        `;

    if (reviews.length === 0) {
      return NextResponse.json({
        reviews: [],
        total_reviews: 0,
        average_rating: 0,
        average_wait_rating: 0,
        average_bedside_rating: 0,
      });
    }

    const total = reviews.length;
    const avgRating =
      reviews.reduce((acc: number, r: any) => acc + Number(r.rating || 0), 0) / total;
    const avgWait =
      reviews.reduce((acc: number, r: any) => acc + Number(r.waiting_time_rating || 0), 0) /
      total;
    const avgBedside =
      reviews.reduce(
        (acc: number, r: any) => acc + Number(r.bedside_manner_rating || 0),
        0
      ) / total;

    return NextResponse.json({
      reviews,
      total_reviews: total,
      average_rating: Number(avgRating.toFixed(1)),
      average_wait_rating: Number(avgWait.toFixed(1)),
      average_bedside_rating: Number(avgBedside.toFixed(1)),
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return apiError(500, "Failed to load reviews.", "internal_error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit(rateLimitKey(req, "reviews:submit"), 5, 3600);
    if (!limit.allowed) {
      return NextResponse.json(tooManyRequests(limit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      doctor_slug,
      patient_name,
      patient_phone,
      rating,
      waiting_time_rating = 5,
      bedside_manner_rating = 5,
      comment = null,
    } = body;

    if (!doctor_slug || !patient_name || !rating) {
      return apiError(
        400,
        "doctor_slug, patient_name, and rating are required.",
        "missing_fields"
      );
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return apiError(400, "rating must be an integer between 1 and 5.", "invalid_rating");
    }

    const doctorExists = await sql`
      SELECT slug FROM doctors
      WHERE lower(slug) = ${String(doctor_slug).toLowerCase().trim()}
        AND COALESCE(is_active, true) = true
      LIMIT 1;
    `;
    if (doctorExists.length === 0) {
      return apiError(404, "Doctor not found.", "doctor_not_found");
    }

    // Mark verified only when a completed consultation matches.
    const cleanPhone = String(patient_phone || "").replace(/[^0-9]/g, "").slice(-10);
    const verifiedRows = cleanPhone
      ? await sql`
          SELECT 1 FROM appointments
          WHERE doctor_slug = ${String(doctor_slug).toLowerCase().trim()}
            AND status = 'completed'
            AND right(regexp_replace(patient_phone, '[^0-9]', '', 'g'), 10) = ${cleanPhone}
            AND created_at >= NOW() - INTERVAL '30 days'
          LIMIT 1;
        `
      : await sql`
          SELECT 1 FROM appointments
          WHERE doctor_slug = ${String(doctor_slug).toLowerCase().trim()}
            AND status = 'completed'
            AND lower(trim(patient_name)) = lower(trim(${String(patient_name)}))
            AND created_at >= NOW() - INTERVAL '30 days'
          LIMIT 1;
        `;

    const isVerifiedVisit = verifiedRows.length > 0;
    const id = randomUUID();

    await sql`
      INSERT INTO reviews (
        id, doctor_slug, patient_name, rating, waiting_time_rating,
        bedside_manner_rating, comment, is_verified_visit, created_at
      ) VALUES (
        ${id}, ${String(doctor_slug).toLowerCase().trim()}, ${String(patient_name).trim()},
        ${numericRating}, ${Number(waiting_time_rating)},
        ${Number(bedside_manner_rating)}, ${comment ? String(comment).slice(0, 2000) : null},
        ${isVerifiedVisit}, NOW()
      );
    `;

    return NextResponse.json({
      success: true,
      message: isVerifiedVisit
        ? "Review submitted — verified patient."
        : "Review submitted. It will be marked verified once a completed consultation is matched.",
      review: {
        id,
        doctor_slug,
        patient_name,
        rating: numericRating,
        comment,
        verified_patient: isVerifiedVisit,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error submitting review:", error);
    return apiError(500, "Failed to submit review.", "internal_error");
  }
}
