"use client";

import DynamicConsultationStudioPage from "@/app/dashboard/consult/[id]/page";

export default function StandaloneConsultationPage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <DynamicConsultationStudioPage />
      </div>
    </div>
  );
}
