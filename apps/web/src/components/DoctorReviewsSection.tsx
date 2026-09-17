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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            Verified Patient Reviews & Clinical Ratings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Based on completed consultations verified by ClinicOS digital token check-ins.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition"
        >
          <PlusCircle className="h-4 w-4" />
          Write a Review
        </button>
      </div>

      {/* Ratings Metrics Cards */}
      {data && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-center dark:border-slate-800 dark:bg-slate-950">
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              {data.average_rating}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">Overall Satisfaction</div>
            <div className="text-[10px] text-slate-400 font-mono">({data.total_reviews} verified patients)</div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-center dark:border-slate-800 dark:bg-slate-950">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 font-mono">
              <Clock className="h-5 w-5 text-emerald-600" />
              {data.metrics.waiting_time_score}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">Wait Time Score</div>
            <div className="text-[10px] text-slate-400">Live token queuing</div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-center dark:border-slate-800 dark:bg-slate-950">
            <div className="text-2xl font-black text-brand-600 dark:text-brand-400 flex items-center justify-center gap-1.5 font-mono">
              <CheckCircle2 className="h-5 w-5 text-brand-600" />
              {data.metrics.bedside_manner_score}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">Bedside Manner</div>
            <div className="text-[10px] text-slate-400">Doctor empathy & clarity</div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading verified feedback...</div>
        ) : !data || data.reviews.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No patient reviews recorded yet. Be the first to review after your visit!
          </div>
        ) : (
          data.reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-950/50 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {rev.patient_name}
                      </span>
                      {rev.is_verified_visit && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <ShieldCheck className="h-3 w-3" /> Verified Visit
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{rev.created_at}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.round(rev.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                "{rev.comment}"
              </p>

              {/* Sub-ratings */}
              <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400">
                <span>Wait time: <strong className="text-slate-700 dark:text-slate-300 font-mono">{rev.waiting_time_rating}/5</strong></span>
                <span>•</span>
                <span>Bedside manner: <strong className="text-slate-700 dark:text-slate-300 font-mono">{rev.bedside_manner_rating}/5</strong></span>
              </div>

              {/* Doctor's official reply if present */}
              {rev.doctor_reply && (
                <div className="rounded-lg border-l-2 border-brand-500 bg-brand-50/50 p-3 text-xs dark:bg-brand-950/30 dark:border-brand-600 mt-2">
                  <div className="text-[11px] font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Response from {doctorName}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                Rate & Review {doctorName}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Review Published!</h4>
                <p className="text-xs text-slate-500">Thank you for helping other patients find quality care.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {/* Overall Rating Star Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Overall Experience ({formRating} / 5 Stars)
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormRating(star)}
                        className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= formRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wait Time & Bedside Manner Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Wait Time Score
                    </label>
                    <select
                      value={formWaitRating}
                      onChange={(e) => setFormWaitRating(parseFloat(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value={5}>5 - Minimal Wait (&lt; 10 mins)</option>
                      <option value={4}>4 - Fast (10-20 mins)</option>
                      <option value={3}>3 - Average (20-30 mins)</option>
                      <option value={2}>2 - Long Wait (&gt; 30 mins)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Doctor Bedside Manner
                    </label>
                    <select
                      value={formBedsideRating}
                      onChange={(e) => setFormBedsideRating(parseFloat(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value={5}>5 - Very Patient & Empathetic</option>
                      <option value={4}>4 - Clear & Helpful</option>
                      <option value={3}>3 - Standard Consultation</option>
                      <option value={2}>2 - Rushed Consultation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Your Clinical Experience / Feedback
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Describe how the doctor examined you, explanation of diagnosis, clinic cleanliness, etc."
                    className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
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
