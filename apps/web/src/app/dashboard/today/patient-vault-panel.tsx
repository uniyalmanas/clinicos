"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Button, Card } from "@/components/design-system";

export function PatientVaultPanel({ patientPhone }: { patientPhone: string }) {
  return (
    <Card variant="elevated" className="p-6">
      <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white mb-4">Patient Vault</h3>
      <div className="text-xs text-[#6E6E73] dark:text-[#636366]">Patient records for {patientPhone}</div>
    </Card>
  );
}
