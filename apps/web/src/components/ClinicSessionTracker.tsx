"use client";

import { useEffect } from "react";

export default function ClinicSessionTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof window !== "undefined" && slug) {
      try {
        sessionStorage.setItem("clinicos_last_clinic_slug", slug);
        localStorage.setItem("clinicos_last_clinic_slug", slug);
      } catch {}
    }
  }, [slug]);

  return null;
}
