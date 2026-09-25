"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Trash2, Home, Stethoscope } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for diagnostic telemetry
    console.error("ClinicOS Client-Side Exception caught by error boundary:", error);
  }, [error]);

  const handleResetSessionAndReload = () => {
    try {
      localStorage.removeItem("clinicos_patient_session");
      sessionStorage.clear();
    } catch {}
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#ECEEF2] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col justify-between p-6 sm:p-12">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0071E3] text-white shadow-apple-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-[#1D1D1F] dark:text-white">
              DocSphere ClinicOS
            </span>
            <span className="block text-[10px] text-[#86868B] dark:text-[#8E8E93]">
              Application Recovery Console
            </span>
          </div>
        </div>
      </header>

      {/* Center Recovery Card */}
      <main className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-lg rounded-3xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-8 shadow-apple-card text-center space-y-6">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
              Application Notice
            </h1>
            <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93] leading-relaxed max-w-md mx-auto">
              A temporary display error occurred while rendering this view. This can happen if outdated session cache exists in your browser.
            </p>
          </div>

          {error?.message && (
            <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-[11px] font-mono text-[#86868B] dark:text-[#8E8E93] text-left truncate">
              {error.message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-6 py-3 text-xs font-bold text-white shadow-apple-sm transition active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Rendering</span>
            </button>

            <button
              onClick={handleResetSessionAndReload}
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-black/[0.1] dark:border-white/[0.15] bg-white dark:bg-[#2C2C2E] px-6 py-3 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition active:scale-95"
            >
              <Trash2 className="h-4 w-4 text-amber-500" />
              <span>Clear Session &amp; Reload</span>
            </button>
          </div>

          <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0071E3] dark:text-[#2997FF] hover:underline"
            >
              <Home className="h-3.5 w-3.5" /> Return to Homepage
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#86868B] dark:text-[#8E8E93] py-4">
        DocSphere ClinicOS • Pure 2-Tier Serverless Next.js &amp; Supabase
      </footer>
    </div>
  );
}
