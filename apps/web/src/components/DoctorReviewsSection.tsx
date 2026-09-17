"use client";

import React, { useState, useEffect } from "react";
import { Star, ShieldCheck, MessageSquare, ThumbsUp, PlusCircle, CheckCircle2, Clock, User, X } from "lucide-react";

interface ReviewItem {
  id: string;
  patient_name: string;
  rating: number;
  waiting_time_rating: number;
  bedside_manner_rating: number;
  comment: string;
  doctor_reply?: string;
  is_verified_visit: boolean;
  created_at: string;
}

interface ReviewsData {
  doctor_slug: string;
  total_reviews: number;
  average_rating: number;
  metrics: {
    overall_satisfaction: number;
    waiting_time_score: number;
    bedside_manner_score: number;
  };
  reviews: ReviewItem[];
}

export default function DoctorReviewsSection({ doctorSlug, doctorName }: { doctorSlug: string; doctorName: string }) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Review Form State
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formWaitRating, setFormWaitRating] = useState(5);
  const [formBedsideRating, setFormBedsideRating] = useState(5);
  const [formComment, setFormComment] = useState("");

  const loadReviews = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/reviews?doctor_slug=${doctorSlug}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [doctorSlug]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_slug: doctorSlug,
          patient_name: formName,
          rating: formRating,
          waiting_time_rating: formWaitRating,
          bedside_manner_rating: formBedsideRating,
          comment: formComment
        })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitSuccess(false);
          setFormName("");
          setFormComment("");
          loadReviews();
        }, 1200);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.04] dark:border-white/[0.06] pb-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Verified Patient Reviews & Clinical Ratings
          </h2>
          <p className="text-xs text-[#86868B] mt-0.5 font-normal">
            Based on completed consultations verified by ClinicOS digital token check-ins.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-apple-blue hover:bg-[#0077ED] px-4 py-2 text-xs font-semibold text-white shadow-apple-sm active:scale-[0.98] transition"
        >
          <PlusCircle className="h-4 w-4" />
          Write a Review
        </button>
      </div>

      {/* Ratings Metrics Cards */}
      {data && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-[20px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] p-4 text-center">
            <div className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center justify-center gap-1.5 font-mono">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              {data.average_rating}
            </div>
            <div className="text-[11px] font-medium text-[#86868B] mt-1">Overall Satisfaction</div>
            <div className="text-[10px] text-[#86868B]/80 font-mono">({data.total_reviews} verified patients)</div>
          </div>

          <div className="rounded-[20px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] p-4 text-center">
            <div className="text-2xl font-bold tracking-tight text-apple-teal dark:text-[#30D1BE] flex items-center justify-center gap-1.5 font-mono">
              <Clock className="h-5 w-5" />
              {data.metrics.waiting_time_score}
            </div>
            <div className="text-[11px] font-medium text-[#86868B] mt-1">Wait Time Score</div>
            <div className="text-[10px] text-[#86868B]/80">Live token queuing</div>
          </div>

          <div className="rounded-[20px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] p-4 text-center">
            <div className="text-2xl font-bold tracking-tight text-apple-blue dark:text-sky-400 flex items-center justify-center gap-1.5 font-mono">
              <CheckCircle2 className="h-5 w-5" />
              {data.metrics.bedside_manner_score}
            </div>
            <div className="text-[11px] font-medium text-[#86868B] mt-1">Bedside Manner</div>
            <div className="text-[10px] text-[#86868B]/80">Doctor empathy & clarity</div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="mt-6 space-y-3.5">
        {loading ? (
          <div className="py-8 text-center text-xs text-[#86868B]">Loading verified feedback...</div>
        ) : !data || data.reviews.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#86868B]">
            No patient reviews recorded yet. Be the first to review after your visit!
          </div>
        ) : (
          data.reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-[20px] bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/50 border border-black/[0.04] dark:border-white/[0.06] p-5 space-y-3 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-xs font-semibold text-[#1D1D1F] dark:text-white">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
                        {rev.patient_name}
                      </span>
                      {rev.is_verified_visit && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-apple-teal/10 px-2 py-0.5 text-[10px] font-medium text-apple-teal dark:text-[#30D1BE]">
                          <ShieldCheck className="h-3 w-3" /> Verified Visit
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#86868B]">{rev.created_at}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.round(rev.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-black/10 dark:text-white/15"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[#515154] dark:text-[#A1A1A6]">
                "{rev.comment}"
              </p>

              {/* Sub-ratings */}
              <div className="flex items-center gap-4 text-[10px] text-[#86868B]">
                <span>Wait time: <strong className="text-[#1D1D1F] dark:text-white font-mono font-medium">{rev.waiting_time_rating}/5</strong></span>
                <span>•</span>
                <span>Bedside manner: <strong className="text-[#1D1D1F] dark:text-white font-mono font-medium">{rev.bedside_manner_rating}/5</strong></span>
              </div>

              {/* Doctor's official reply if present */}
              {rev.doctor_reply && (
                <div className="rounded-[16px] bg-apple-blue/5 dark:bg-apple-blue/10 border-l-2 border-apple-blue p-3.5 text-xs mt-2">
                  <div className="text-[11px] font-semibold text-apple-blue flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Response from {doctorName}
                  </div>
                  <p className="text-[11px] text-[#515154] dark:text-[#A1A1A6] mt-1">
                    {rev.doctor_reply}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-7 shadow-apple-modal">
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                Rate & Review {doctorName}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-apple-teal/10 text-apple-teal">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Review Published</h4>
                <p className="text-xs text-[#86868B]">Thank you for helping other patients find quality care.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] dark:text-white">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="mt-1.5 w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-[#F5F5F7] dark:bg-black/40 px-3.5 py-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>

                {/* Overall Rating Star Selector */}
                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] dark:text-white">
                    Overall Experience ({formRating} / 5 Stars)
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormRating(star)}
                        className="p-1 text-black/20 dark:text-white/20 hover:text-amber-400 focus:outline-none transition active:scale-95"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= formRating ? "fill-amber-400 text-amber-400" : "text-black/20 dark:text-white/20"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wait Time & Bedside Manner Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#86868B]">
                      Wait Time Score
                    </label>
                    <select
                      value={formWaitRating}
                      onChange={(e) => setFormWaitRating(parseFloat(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] px-2.5 py-2 text-xs bg-[#F5F5F7] dark:bg-black/40 text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                    >
                      <option value={5}>5 - Minimal Wait (&lt; 10 mins)</option>
                      <option value={4}>4 - Fast (10-20 mins)</option>
                      <option value={3}>3 - Average (20-30 mins)</option>
                      <option value={2}>2 - Long Wait (&gt; 30 mins)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868B]">
                      Doctor Bedside Manner
                    </label>
                    <select
                      value={formBedsideRating}
                      onChange={(e) => setFormBedsideRating(parseFloat(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] px-2.5 py-2 text-xs bg-[#F5F5F7] dark:bg-black/40 text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                    >
                      <option value={5}>5 - Very Patient & Empathetic</option>
                      <option value={4}>4 - Clear & Helpful</option>
                      <option value={3}>3 - Standard Consultation</option>
                      <option value={2}>2 - Rushed Consultation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] dark:text-white">
                    Your Clinical Experience / Feedback
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Describe how the doctor examined you, explanation of diagnosis, clinic cleanliness, etc."
                    className="mt-1.5 w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-[#F5F5F7] dark:bg-black/40 p-3 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-full border border-black/[0.1] dark:border-white/[0.12] px-5 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-[0.98] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-full bg-apple-blue hover:bg-[#0077ED] px-5 py-2 text-xs font-semibold text-white shadow-apple-sm active:scale-[0.98] transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Publishing..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
