"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { roleHome } from "@/lib/role-home";

/**
 * The generic /dashboard route is only an entry point. Every role has a
 * purpose-built landing screen (doctor cockpit, reception command centre,
 * pharmacy POS, lab worklist), so this page resolves the signed-in role and
 * forwards there instead of rendering a second, unsynchronised dashboard.
 */
export default function DashboardEntryPage() {
  const router = useRouter();

  useEffect(() => {
    let role: string | null = null;
    try {
      const raw = localStorage.getItem("clinicos_user");
      if (raw) role = String(JSON.parse(raw)?.role || "");
    } catch {}
    router.replace(roleHome(role));
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#0071E3] dark:border-white/20 dark:border-t-white" />
        <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Opening your clinic workspace…
        </p>
      </div>
    </div>
  );
}
