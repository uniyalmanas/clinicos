"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  className?: string;
}

export default function BackButton({
  fallbackUrl = "/dashboard",
  label = "Back",
  className = ""
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const state = window.history.state;
      // In Next.js App Router, in-app client-side navigation sets history.state.idx > 0
      const hasInternalHistory = Boolean(
        state && typeof state.idx === "number" && state.idx > 0
      );
      if (hasInternalHistory) {
        router.back();
        return;
      }

      // If document.referrer came from the same host (and not the exact same page)
      if (
        document.referrer &&
        document.referrer.includes(window.location.host) &&
        !document.referrer.endsWith(window.location.pathname)
      ) {
        router.back();
        return;
      }
    }
    router.push(fallbackUrl);
  };

  return (
    <button
      onClick={handleBack}
      type="button"
      className={`inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/80 px-3.5 py-1.5 text-xs font-medium text-[#1D1D1F] shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-apple-sm active:scale-95 dark:border-white/[0.12] dark:bg-[#1C1C1E]/80 dark:text-white dark:hover:bg-[#2C2C2E] ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}
