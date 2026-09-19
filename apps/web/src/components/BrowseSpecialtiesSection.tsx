"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  ArrowRight, 
  Check, 
  Minus, 
  Sparkles, 
  Mic, 
  X, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  MessageSquare, 
  ChevronRight,
  Stethoscope,
  Building2,
  Zap,
  HelpCircle,
  ExternalLink
} from "lucide-react";

// ============================================================================
// HIGH-FIDELITY MEDICAL SPECIALTY SVG ICONS (MATCHING SCREENSHOT)
// ============================================================================

export function GeneralPhysicianIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="20" r="10" stroke="#1D1D1F" strokeWidth="2.5" />
      <path d="M26 12C26 8 38 8 38 12" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 10H34M32 8V12" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 48C18 38 24 34 32 34C40 34 46 38 46 48" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      {/* Stethoscope around neck */}
      <path d="M25 35V42C25 46 39 46 39 42V35" stroke="#0071E3" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="39" cy="45" r="3" fill="#0071E3" />
      <circle cx="25" cy="33" r="1.5" fill="#0071E3" />
      <circle cx="39" cy="33" r="1.5" fill="#0071E3" />
    </svg>
  );
}

export function DermatologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Woman's hair profile */}
      <path d="M22 42C18 36 18 24 26 18C34 12 44 16 46 26C47 34 42 42 34 44" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 28C26 34 29 38 34 38C37 38 38 35 38 32" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" />
      {/* Glowing Skin Sparkles */}
      <path d="M46 14L48 18L52 20L48 22L46 26L44 22L40 20L44 18L46 14Z" fill="#F59E0B" />
      <path d="M20 16L21 19L24 20L21 21L20 24L19 21L16 20L19 19L20 16Z" fill="#F59E0B" />
    </svg>
  );
}

export function ObstetricsIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Stylized Uterus / Reproductive anatomy */}
      <path d="M32 46V36C32 30 26 26 22 22C18 18 16 24 20 28C24 32 26 34 26 38" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 46V36C32 30 38 26 42 22C46 18 48 24 44 28C40 32 38 34 38 38" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 46H36" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="18" cy="20" rx="3.5" ry="2.5" fill="#EC4899" opacity="0.6" stroke="#EC4899" strokeWidth="1.5" />
      <ellipse cx="46" cy="20" rx="3.5" ry="2.5" fill="#EC4899" opacity="0.6" stroke="#EC4899" strokeWidth="1.5" />
    </svg>
  );
}

export function OrthopaedicsIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Knee joint bone articulation */}
      <path d="M26 14V22C26 26 24 28 22 28M38 14V22C38 26 40 28 42 28" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="32" cy="32" rx="6" ry="4" stroke="#0071E3" strokeWidth="2.2" fill="#0071E3" fillOpacity="0.1" />
      <path d="M22 36C24 36 26 38 26 42V50M42 36C40 36 38 38 38 42V50" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      {/* Mobility radiation arches */}
      <path d="M16 28C14 30 14 34 16 36" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      <path d="M48 28C50 30 50 34 48 36" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EntIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* ENT Specialist with head mirror */}
      <circle cx="32" cy="24" r="10" stroke="#1D1D1F" strokeWidth="2.5" />
      <circle cx="32" cy="17" r="3.5" stroke="#0071E3" strokeWidth="2" fill="#E0F2FE" />
      <path d="M22 17H42" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" />
      {/* Doctor Coat */}
      <path d="M18 48C18 40 24 38 32 38C40 38 46 40 46 48" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 38V48" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" />
      <path d="M26 48L30 40M38 48L34 40" stroke="#0071E3" strokeWidth="1.8" />
    </svg>
  );
}

export function NeurologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Human Brain Lobes */}
      <path d="M32 16C26 16 22 20 22 26C20 27 18 30 18 34C18 38 20 42 24 44C25 47 28 48 32 48" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" fill="#FDF2F8" />
      <path d="M32 16C38 16 42 20 42 26C44 27 46 30 46 34C46 38 44 42 40 44C39 47 36 48 32 48" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" fill="#FDF2F8" />
      <path d="M32 16V48" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" />
      <path d="M26 26C28 28 28 32 26 34M38 26C36 28 36 32 38 34" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CardiologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Anatomical Heart silhouette with ECG pulse */}
      <path d="M32 48C32 48 16 38 16 26C16 20 21 16 26 16C29 16 31 18 32 20C33 18 35 16 38 16C43 16 48 20 48 26C48 38 32 48 32 48Z" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#FEF2F2" />
      <path d="M12 32H24L27 25L31 39L35 28L38 34L41 32H52" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UrologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Kidneys & Bladder */}
      <path d="M22 22C18 22 16 26 16 30C16 36 22 38 24 34" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M42 22C46 22 48 26 48 30C48 36 42 38 40 34" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24 34V42C24 45 28 47 32 47C36 47 40 45 40 42V34" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="32" cy="46" r="4.5" fill="#F59E0B" fillOpacity="0.4" stroke="#F59E0B" strokeWidth="1.8" />
    </svg>
  );
}

export function GastroenterologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Stomach with Gastric Fluid */}
      <path d="M26 14V22C26 22 20 24 18 30C16 36 18 44 26 48C34 52 42 46 44 38C46 30 42 24 34 24C32 24 32 18 32 14" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Orange Gastric Acid */}
      <path d="M19 36C22 35 25 37 28 36C31 35 34 37 37 36C40 35 43 37 43 37C42 43 36 47 30 47C24 47 19 42 19 36Z" fill="#F97316" fillOpacity="0.5" stroke="#EA580C" strokeWidth="1.5" />
      <circle cx="26" cy="40" r="1.5" fill="#FFFFFF" />
      <circle cx="33" cy="42" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}

export function PsychiatryIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Head silhouette with orbital mind bands */}
      <path d="M30 48H22C20 48 18 46 18 42C18 36 20 34 20 30C20 22 26 16 34 16C42 16 46 22 46 30C46 38 42 42 42 48" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 36H24C26 36 28 38 28 40V42" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" />
      {/* Swirling energy ellipse */}
      <ellipse cx="34" cy="24" rx="10" ry="4" stroke="#F59E0B" strokeWidth="2" transform="rotate(-15 34 24)" />
    </svg>
  );
}

export function PaediatricsIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Smiling Baby in Blue Swaddle */}
      <circle cx="34" cy="24" r="8" fill="#FEE2E2" stroke="#1D1D1F" strokeWidth="2.2" />
      <ellipse cx="32" cy="24" rx="1" ry="1.5" fill="#1D1D1F" />
      <ellipse cx="36" cy="24" rx="1" ry="1.5" fill="#1D1D1F" />
      <path d="M33 27C34 28 35 28 36 27" stroke="#1D1D1F" strokeWidth="1.2" strokeLinecap="round" />
      {/* Blue Swaddle blanket wrap */}
      <path d="M24 28C20 32 20 42 26 48C32 54 42 50 44 42C46 34 40 28 34 28" fill="#60A5FA" fillOpacity="0.3" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 38L38 46M40 36L26 44" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PulmonologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Torso & Lungs */}
      <path d="M32 14V34" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      {/* Left Lung */}
      <path d="M30 26C24 26 18 30 18 38C18 44 22 48 28 48C30 48 30 44 30 38" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" fill="#FEE2E2" fillOpacity="0.4" />
      {/* Right Lung */}
      <path d="M34 26C40 26 46 30 46 38C46 44 42 48 36 48C34 48 34 44 34 38" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" fill="#FEE2E2" fillOpacity="0.4" />
      <path d="M32 26L26 32M32 28L38 34" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function EndocrinologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Butterfly Thyroid Gland */}
      <path d="M22 20C16 24 16 38 24 44C27 46 29 42 30 38C30 34 28 28 28 20H22Z" stroke="#1D1D1F" strokeWidth="2.2" fill="#FEF3C7" />
      <path d="M42 20C48 24 48 38 40 44C37 46 35 42 34 38C34 34 36 28 36 20H42Z" stroke="#1D1D1F" strokeWidth="2.2" fill="#FEF3C7" />
      <path d="M28 28C30 30 34 30 36 28" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" />
      {/* Secretory metabolic nodes */}
      <circle cx="23" cy="30" r="1.5" fill="#F59E0B" />
      <circle cx="24" cy="36" r="1.5" fill="#F59E0B" />
      <circle cx="41" cy="30" r="1.5" fill="#F59E0B" />
      <circle cx="40" cy="36" r="1.5" fill="#F59E0B" />
    </svg>
  );
}

export function NephrologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Symmetrical Human Kidneys */}
      <path d="M24 20C18 20 14 26 14 32C14 40 20 44 26 40C28 38 26 34 26 30C26 26 28 22 24 20Z" stroke="#1D1D1F" strokeWidth="2.5" fill="#FED7AA" fillOpacity="0.4" />
      <path d="M40 20C46 20 50 26 50 32C50 40 44 44 38 40C36 38 38 34 38 30C38 26 36 22 40 20Z" stroke="#1D1D1F" strokeWidth="2.5" fill="#FED7AA" fillOpacity="0.4" />
      {/* Renal Pelvis Tubing */}
      <path d="M26 32H30V48M38 32H34V48" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function NeurosurgeryIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Brain with surgical precision scalpel */}
      <path d="M30 18C24 18 20 22 20 28C18 29 16 32 16 36C16 40 18 44 22 46C23 48 26 50 30 50" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M30 18C36 18 40 22 40 28C42 29 44 32 44 36C44 40 42 44 38 46" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" />
      {/* Precision Scalpel */}
      <path d="M24 28L46 44M44 42L48 46L46 48L42 44" stroke="#0071E3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RheumatologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Joint articulation with inflammatory rays */}
      <path d="M26 14V22C26 26 24 28 22 28M38 14V22C38 26 40 28 42 28" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="5" fill="#EF4444" fillOpacity="0.2" stroke="#EF4444" strokeWidth="2" />
      <path d="M22 36C24 36 26 38 26 42V50M42 36C40 36 38 38 38 42V50" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 30L16 32L20 34M44 30L48 32L44 34" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OphthalmologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Eye with Loupe Glass */}
      <path d="M14 32C18 24 25 20 32 20C39 20 46 24 50 32C46 40 39 44 32 44C25 44 18 40 14 32Z" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="6" stroke="#0071E3" strokeWidth="2.2" fill="#E0F2FE" />
      <circle cx="32" cy="32" r="2.5" fill="#0071E3" />
      {/* Magnifier / Loupe Handle */}
      <circle cx="34" cy="32" r="10" stroke="#F59E0B" strokeWidth="2" />
      <path d="M42 39L50 48" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function SurgicalGastroIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Digestive stomach with surgical mark */}
      <path d="M26 14V22C26 22 20 24 18 30C16 36 18 44 26 48C34 52 42 46 44 38C46 30 42 24 34 24C32 24 32 18 32 14" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 36L42 36" stroke="#EA580C" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="32" cy="36" r="3" fill="#0071E3" />
      <path d="M30 44L34 40" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function InfectiousDiseaseIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Hand with microbe barrier */}
      <path d="M20 48V32C20 30 22 28 24 28C26 28 28 30 28 32V24C28 22 30 20 32 20C34 20 36 22 36 24V28" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M36 28C36 26 38 24 40 24C42 24 44 26 44 28V36C44 44 38 48 30 48H20" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" />
      {/* Virus particle */}
      <circle cx="44" cy="38" r="6" stroke="#F59E0B" strokeWidth="2" fill="#FEF3C7" />
      <path d="M44 30V34M44 42V46M36 38H40M48 38H52" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function GeneralSurgeryIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Abdomen torso with laparoscopic scalpel */}
      <path d="M22 20C24 28 24 38 22 46M42 20C40 28 40 38 42 46" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 42C28 46 36 46 42 42" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M32 28V34" stroke="#0071E3" strokeWidth="3" strokeLinecap="round" />
      {/* Scalpel blade */}
      <path d="M36 22L28 32" stroke="#0071E3" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function PsychologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Female therapist with Psi Ψ symbol */}
      <circle cx="32" cy="22" r="8" stroke="#1D1D1F" strokeWidth="2.2" />
      <path d="M20 46C20 38 26 36 32 36C38 36 44 38 44 46" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 26C24 32 26 34 32 34C38 34 40 32 40 26" stroke="#1D1D1F" strokeWidth="1.8" />
      {/* Greek letter Psi Ψ */}
      <path d="M30 40V46M34 40V46M32 38V48M28 42C28 45 36 45 36 42" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function MedicalOncologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Awareness ribbon in cupped hands */}
      <path d="M30 20C30 16 34 16 34 20C34 24 26 32 26 36L24 44M34 20C34 24 38 32 38 36L40 44" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 30L38 30" stroke="#1D1D1F" strokeWidth="2.2" />
      {/* Cupped hands */}
      <path d="M18 42C22 46 28 48 34 48H44" stroke="#0071E3" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M44 40C44 44 38 48 32 48" stroke="#0071E3" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function DiabetologyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Glucometer and finger prick blood drop */}
      <rect x="30" y="16" width="16" height="24" rx="4" stroke="#1D1D1F" strokeWidth="2.2" fill="#F3F4F6" />
      <rect x="33" y="20" width="10" height="7" rx="1.5" fill="#1D1D1F" />
      <circle cx="38" cy="34" r="2" fill="#0071E3" />
      {/* Finger with blood drop */}
      <path d="M22 48V34C22 31 24 29 27 29C30 29 32 31 32 34V48" stroke="#1D1D1F" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M27 24C27 24 24 27 24 29C24 30.5 25.5 32 27 32C28.5 32 30 30.5 30 29C30 27 27 24 27 24Z" fill="#EF4444" />
    </svg>
  );
}

export function DentistIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      {/* Molar tooth with dental mirror */}
      <path d="M22 22C22 18 26 16 30 18C32 19 34 19 36 18C40 16 44 18 44 22C44 28 42 34 40 44C39 48 36 48 35 44C34 40 33 34 33 34C33 34 32 40 31 44C30 48 27 48 26 44C24 34 22 28 22 22Z" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#F8FAFC" />
      {/* Dental instrument */}
      <path d="M42 20L50 14M48 12L52 16" stroke="#0071E3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="50" cy="14" r="2.5" stroke="#F59E0B" strokeWidth="1.8" />
    </svg>
  );
}

// ============================================================================
// DATA STRUCTURE FOR 24 SPECIALTIES (FAITHFUL TO SCREENSHOT)
// ============================================================================

export interface SpecialtyItem {
  id: string;
  name: string;
  shortName: string;
  icon: React.ComponentType;
  category: "Primary Care" | "Skin & Hair" | "Bones & Organs" | "Surgery" | "Mental Health" | "Women & Child";
  doctorCount: number;
  popularConditions: string[];
  slug: string;
}

export const SPECIALTIES_DATA: SpecialtyItem[] = [
  {
    id: "general-physician",
    name: "General Physician / Internal Medicine",
    shortName: "General Physician",
    icon: GeneralPhysicianIcon,
    category: "Primary Care",
    doctorCount: 18,
    popularConditions: ["Fever & Viral", "Cough & Cold", "Blood Pressure", "Infections"],
    slug: "general-physician"
  },
  {
    id: "dermatology",
    name: "Dermatology",
    shortName: "Dermatology",
    icon: DermatologyIcon,
    category: "Skin & Hair",
    doctorCount: 12,
    popularConditions: ["Acne & Scars", "Fungal Infection", "Hair Fall", "Eczema"],
    slug: "dermatologist"
  },
  {
    id: "obstetrics-gynaecology",
    name: "Obstetrics & Gynaecology",
    shortName: "Obstetrics & Gynaecology",
    icon: ObstetricsIcon,
    category: "Women & Child",
    doctorCount: 14,
    popularConditions: ["Pregnancy Care", "PCOD / PCOS", "Irregular Periods", "Pelvic Pain"],
    slug: "gynaecologist"
  },
  {
    id: "orthopaedics",
    name: "Orthopaedics",
    shortName: "Orthopaedics",
    icon: OrthopaedicsIcon,
    category: "Bones & Organs",
    doctorCount: 15,
    popularConditions: ["Knee Pain", "Backache & Spine", "Fracture", "Arthritis"],
    slug: "orthopaedist"
  },
  {
    id: "ent",
    name: "ENT (Ear, Nose, Throat)",
    shortName: "ENT",
    icon: EntIcon,
    category: "Primary Care",
    doctorCount: 9,
    popularConditions: ["Sinusitis", "Throat Pain", "Ear Discharge", "Tonsillitis"],
    slug: "ent-specialist"
  },
  {
    id: "neurology",
    name: "Neurology",
    shortName: "Neurology",
    icon: NeurologyIcon,
    category: "Bones & Organs",
    doctorCount: 7,
    popularConditions: ["Migraine", "Epilepsy / Seizures", "Vertigo", "Tremors"],
    slug: "neurologist"
  },
  {
    id: "cardiology",
    name: "Cardiology",
    shortName: "Cardiology",
    icon: CardiologyIcon,
    category: "Bones & Organs",
    doctorCount: 11,
    popularConditions: ["Chest Pain", "High BP", "Heart Palpitations", "Cholesterol"],
    slug: "cardiologist"
  },
  {
    id: "urology",
    name: "Urology",
    shortName: "Urology",
    icon: UrologyIcon,
    category: "Bones & Organs",
    doctorCount: 8,
    popularConditions: ["Kidney Stones", "Urinary Infection", "Prostate", "Burning Urination"],
    slug: "urologist"
  },
  {
    id: "gastroenterology",
    name: "Gastroenterology / GI",
    shortName: "Gastroenterology",
    icon: GastroenterologyIcon,
    category: "Bones & Organs",
    doctorCount: 8,
    popularConditions: ["Acidity / GERD", "Liver Disease", "Constipation / IBS", "Gas Bloating"],
    slug: "gastroenterologist"
  },
  {
    id: "psychiatry",
    name: "Psychiatry",
    shortName: "Psychiatry",
    icon: PsychiatryIcon,
    category: "Mental Health",
    doctorCount: 9,
    popularConditions: ["Anxiety & Panic", "Depression", "Insomnia / Sleep", "Stress"],
    slug: "psychiatrist"
  },
  {
    id: "paediatrics",
    name: "Paediatrics",
    shortName: "Paediatrics",
    icon: PaediatricsIcon,
    category: "Women & Child",
    doctorCount: 16,
    popularConditions: ["Newborn Care", "Child Vaccination", "Growth & Milk", "Baby Fever"],
    slug: "pediatrician"
  },
  {
    id: "pulmonology",
    name: "Pulmonology",
    shortName: "Pulmonology",
    icon: PulmonologyIcon,
    category: "Primary Care",
    doctorCount: 6,
    popularConditions: ["Asthma", "Chronic Cough", "Breathing Difficulty", "Allergies"],
    slug: "pulmonologist"
  },
  {
    id: "endocrinology",
    name: "Endocrinology",
    shortName: "Endocrinology",
    icon: EndocrinologyIcon,
    category: "Bones & Organs",
    doctorCount: 5,
    popularConditions: ["Thyroid Disorder", "Hormonal Imbalance", "Obesity", "Growth Issues"],
    slug: "endocrinologist"
  },
  {
    id: "nephrology",
    name: "Nephrology",
    shortName: "Nephrology",
    icon: NephrologyIcon,
    category: "Bones & Organs",
    doctorCount: 5,
    popularConditions: ["Kidney Care", "High Creatinine", "Dialysis Advice", "Swollen Feet"],
    slug: "nephrologist"
  },
  {
    id: "neurosurgery",
    name: "Neurosurgery",
    shortName: "Neurosurgery",
    icon: NeurosurgeryIcon,
    category: "Surgery",
    doctorCount: 4,
    popularConditions: ["Spine Surgery", "Slip Disc", "Brain Tumour", "Nerve Compression"],
    slug: "neurosurgeon"
  },
  {
    id: "rheumatology",
    name: "Rheumatology",
    shortName: "Rheumatology",
    icon: RheumatologyIcon,
    category: "Bones & Organs",
    doctorCount: 4,
    popularConditions: ["Rheumatoid Arthritis", "Uric Acid / Gout", "Lupus / Autoimmune", "Joint Swelling"],
    slug: "rheumatologist"
  },
  {
    id: "ophthalmology",
    name: "Ophthalmology",
    shortName: "Ophthalmology",
    icon: OphthalmologyIcon,
    category: "Primary Care",
    doctorCount: 8,
    popularConditions: ["Eye Strain & Glasses", "Cataract", "Red Eyes / Conjunctivitis", "Glaucoma"],
    slug: "ophthalmologist"
  },
  {
    id: "surgical-gastroenterology",
    name: "Surgical Gastroenterology",
    shortName: "Surgical Gastroenterology",
    icon: SurgicalGastroIcon,
    category: "Surgery",
    doctorCount: 4,
    popularConditions: ["Gallbladder Stones", "Hernia Laparoscopy", "Appendix Removal", "GI Surgery"],
    slug: "surgical-gastroenterologist"
  },
  {
    id: "infectious-disease",
    name: "Infectious Disease",
    shortName: "Infectious Disease",
    icon: InfectiousDiseaseIcon,
    category: "Primary Care",
    doctorCount: 5,
    popularConditions: ["Dengue / Malaria", "Typhoid", "Prolonged Fever", "Post-Viral Fatigue"],
    slug: "infectious-disease"
  },
  {
    id: "general-surgery",
    name: "General & Laparoscopic Surgery",
    shortName: "General Surgery",
    icon: GeneralSurgeryIcon,
    category: "Surgery",
    doctorCount: 7,
    popularConditions: ["Piles / Fissure", "Laparoscopy", "Wound Care", "Cyst Removal"],
    slug: "general-surgeon"
  },
  {
    id: "psychology",
    name: "Psychology",
    shortName: "Psychology",
    icon: PsychologyIcon,
    category: "Mental Health",
    doctorCount: 6,
    popularConditions: ["Talk Therapy", "Relationship Guidance", "Exam Stress", "Habit Coaching"],
    slug: "psychologist"
  },
  {
    id: "medical-oncology",
    name: "Medical Oncology",
    shortName: "Medical Oncology",
    icon: MedicalOncologyIcon,
    category: "Surgery",
    doctorCount: 4,
    popularConditions: ["Chemotherapy Review", "Cancer Screening", "Second Opinion", "Biopsy Guidance"],
    slug: "oncologist"
  },
  {
    id: "diabetology",
    name: "Diabetology",
    shortName: "Diabetology",
    icon: DiabetologyIcon,
    category: "Primary Care",
    doctorCount: 11,
    popularConditions: ["Type 2 Diabetes", "HbA1c Reduction", "Insulin Dose Tuning", "Diabetic Foot Care"],
    slug: "diabetologist"
  },
  {
    id: "dentist",
    name: "Dentist",
    shortName: "Dentist",
    icon: DentistIcon,
    category: "Primary Care",
    doctorCount: 14,
    popularConditions: ["Root Canal (RCT)", "Teeth Cleaning", "Toothache", "Dental Aligners"],
    slug: "dentist"
  }
];

// ============================================================================
// MAIN COMPONENT EXPORT
// ============================================================================

interface BrowseSpecialtiesSectionProps {
  showHero?: boolean;
}

export default function BrowseSpecialtiesSection({ showHero = false }: BrowseSpecialtiesSectionProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSpecialtyModal, setSelectedSpecialtyModal] = useState<SpecialtyItem | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [voiceQuery, setVoiceQuery] = useState<string>("");

  const categories = [
    "All",
    "Primary Care",
    "Skin & Hair",
    "Bones & Organs",
    "Women & Child",
    "Surgery",
    "Mental Health"
  ];

  const filteredSpecialties = useMemo(() => {
    return SPECIALTIES_DATA.filter((item) => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const queryLower = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !queryLower || 
        item.name.toLowerCase().includes(queryLower) ||
        item.shortName.toLowerCase().includes(queryLower) ||
        item.popularConditions.some(c => c.toLowerCase().includes(queryLower));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="w-full">
      {/* CONDITIONAL HERO SECTION (OFF BY DEFAULT FOR CLEAN TOP VIEW) */}
      {showHero && (
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F2F5F9] via-[#ECEEF2] to-[#ECEEF2] pt-12 pb-16 dark:from-[#111215] dark:via-[#090A0C] dark:to-[#000000] border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-6 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Direct Doctor Booking • 100% Commission-Free</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#1D1D1F] dark:text-white leading-[1.08]">
              Book a specialist without <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#0071E3] via-[#008778] to-[#25A18E] bg-clip-text text-transparent">
                paying an aggregator's markup
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base sm:text-xl text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
              DocSphere connects you straight to independent doctors and clinics near you — the same appointment, at the doctor's own price, with nothing added for the platform in between.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#specialties-grid"
                className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] px-7 py-3.5 text-sm font-bold text-white shadow-apple-sm hover:bg-[#0077ED] active:scale-95 transition"
              >
                <span>Browse specialities</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-black/[0.12] bg-white px-7 py-3.5 text-sm font-semibold text-[#1D1D1F] shadow-sm hover:bg-black/[0.02] active:scale-95 transition dark:border-white/[0.15] dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-white/[0.04]"
              >
                <span>How booking works</span>
              </a>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4 max-w-lg mx-auto sm:gap-8">
              <div className="rounded-2xl border border-black/[0.06] bg-white/70 p-4 sm:p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-[#1C1C1E]/70 text-left">
                <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                  0%
                </div>
                <div className="mt-1 text-xs sm:text-sm font-medium text-[#6E6E73] dark:text-[#A1A1A6] leading-snug">
                  commission charged to the doctor on your booking
                </div>
              </div>

              <div className="rounded-2xl border border-black/[0.06] bg-white/70 p-4 sm:p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-[#1C1C1E]/70 text-left">
                <div className="text-3xl sm:text-4xl font-black text-[#0071E3] dark:text-[#2997FF]">
                  30+
                </div>
                <div className="mt-1 text-xs sm:text-sm font-medium text-[#6E6E73] dark:text-[#A1A1A6] leading-snug">
                  specialities covered across independent clinics
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          BROWSE BY SPECIALTIES (20% ENLARGED TO FILL SCREEN)
      ===================================================================== */}
      <section id="specialties-grid" className="pt-4 sm:pt-6 pb-8 px-4 sm:px-6 lg:px-8 bg-[#F8F9FB] dark:bg-[#000000]">
        <div className="mx-auto max-w-[1500px]">
          
          {/* Header & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 pb-4 border-b border-gray-200/80 dark:border-white/10">
            <div className="flex items-center gap-3.5">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
                Browse by Specialties
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                0% Platform Markup
              </span>
            </div>

            {/* Instant Filter Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search specialty, symptom or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-gray-300 bg-white pl-10 pr-8 py-2 text-xs sm:text-sm text-[#1D1D1F] shadow-2xs focus:border-[#008778] focus:outline-none focus:ring-1 focus:ring-[#008778] dark:border-white/15 dark:bg-[#1C1C1E] dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition flex-shrink-0 ${
                  selectedCategory === cat
                    ? "bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F]"
                    : "bg-white text-[#6E6E73] border border-gray-200 hover:border-gray-300 dark:bg-[#1C1C1E] dark:text-[#A1A1A6] dark:border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
            <span className="text-xs text-[#86868B] ml-auto flex-shrink-0 pl-2">
              {filteredSpecialties.length} specialities available
            </span>
          </div>

          {/* 6-Column Grid (20% enlarged buttons to fill screen) */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5">
            {filteredSpecialties.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedSpecialtyModal(item)}
                  className="group relative flex items-center gap-3 rounded-2xl border border-gray-200/90 bg-white p-3 sm:p-3.5 transition-all duration-150 hover:border-[#008778] dark:hover:border-[#34D399] hover:shadow-lg hover:-translate-y-0.5 cursor-pointer dark:border-white/10 dark:bg-[#18181B] h-[80px]"
                >
                  {/* 20% Larger Icon Container (56px) */}
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[#EBF7F5] p-2 transition-transform group-hover:scale-105 group-hover:bg-[#DEF2EE] dark:bg-white/10 dark:group-hover:bg-white/15 [&>svg]:w-full [&>svg]:h-full shadow-2xs">
                    <IconComponent />
                  </div>

                  {/* 20% Larger Typography & Badges */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h3 className="text-[13px] sm:text-[14.5px] font-extrabold text-[#1D1D1F] dark:text-white leading-snug truncate group-hover:text-[#008778] dark:group-hover:text-[#34D399] transition">
                      {item.shortName}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[#86868B] dark:text-[#8E8E93] truncate">
                      <span className="font-bold text-[#0071E3] dark:text-[#2997FF]">
                        {item.doctorCount} Doctors
                      </span>
                      <span>•</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded text-[11px]">
                        0% Fee
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSpecialties.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-dashed border-gray-300 dark:border-white/10 mt-3">
              <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#1D1D1F] dark:text-white">No specialities found matching "{searchQuery}"</p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                className="mt-3 text-xs text-[#0071E3] font-bold hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Quick Condition Tag Cloud */}
          <div className="mt-8 rounded-2xl border border-gray-200/70 bg-white/60 p-4 dark:border-white/10 dark:bg-[#18181B]/60 backdrop-blur-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868B] dark:text-[#8E8E93] mr-3">
              Common Consultations:
            </span>
            <div className="inline-flex flex-wrap gap-1.5 mt-2 sm:mt-0">
              {["Acne & Pimples", "Root Canal", "Childhood Fever", "Acid Reflux", "Backache", "Migraine", "PCOS / Thyroid", "High Blood Pressure", "Anxiety & Sleep"].map((cond) => (
                <button
                  key={cond}
                  onClick={() => setSearchQuery(cond.split(" ")[0])}
                  className="rounded-full bg-gray-100 hover:bg-gray-200 px-2.5 py-0.5 text-[11px] text-[#4A4A4F] transition dark:bg-white/10 dark:text-[#D1D1D6] dark:hover:bg-white/15"
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. WHY BOOK DIRECT INSTEAD OF THROUGH AN AGGREGATOR
          (Side-by-Side Comparison Section)
      ===================================================================== */}
      <section id="why-direct" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#000000] border-t border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-5xl">
          
          {/* Section Heading & Subtitle */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
              Fair Healthcare Economics
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
              Why book direct instead of through an aggregator
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
              Aggregator apps are convenient, but the convenience is funded by fees the doctor pays on every booking, and by ads for other doctors on their own page.
            </p>
          </div>

          {/* Side-by-Side Comparison Cards */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            
            {/* CARD 1: TYPICAL AGGREGATOR APP */}
            <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-6 sm:p-8 dark:border-rose-900/30 dark:bg-rose-950/10 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                    Aggregator Platform
                  </span>
                  <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    High Overhead
                  </span>
                </div>

                <h3 className="mt-4 text-2xl font-black text-[#1D1D1F] dark:text-white">
                  Typical aggregator app
                </h3>
                <p className="mt-1 text-xs text-[#86868B] dark:text-[#8E8E93]">
                  Operates as a marketplace middleman between patient and practitioner.
                </p>

                <div className="mt-8 space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rose-200/80 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 mt-0.5 font-bold text-xs">
                      —
                    </div>
                    <p className="text-sm font-medium text-[#2C2C2E] dark:text-[#E5E5E7] leading-snug">
                      15–30% commission added to the doctor's fee
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rose-200/80 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 mt-0.5 font-bold text-xs">
                      —
                    </div>
                    <p className="text-sm font-medium text-[#2C2C2E] dark:text-[#E5E5E7] leading-snug">
                      Competing doctors' ads shown on the same profile
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rose-200/80 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 mt-0.5 font-bold text-xs">
                      —
                    </div>
                    <p className="text-sm font-medium text-[#2C2C2E] dark:text-[#E5E5E7] leading-snug">
                      Prescription and history locked inside the app
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rose-200/80 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 mt-0.5 font-bold text-xs">
                      —
                    </div>
                    <p className="text-sm font-medium text-[#2C2C2E] dark:text-[#E5E5E7] leading-snug">
                      Ranking influenced by ad spend
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-rose-200/60 dark:border-rose-900/30 text-xs text-rose-700 dark:text-rose-400">
                Patients pay inflated prices to subsidize aggregator commissions.
              </div>
            </div>

            {/* CARD 2: DOCSPHERE */}
            <div className="relative rounded-3xl border-2 border-emerald-500/40 bg-emerald-50/50 p-6 sm:p-8 dark:border-emerald-500/40 dark:bg-emerald-950/15 flex flex-col justify-between shadow-lg shadow-emerald-500/5">
              {/* Popular / Recommended Pill */}
              <div className="absolute -top-3.5 right-6 rounded-full bg-emerald-600 px-3.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider shadow-sm">
                Direct ClinicOS
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    Direct Infrastructure
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" /> 100% Retained
                  </span>
                </div>

                <h3 className="mt-4 text-2xl font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <span>DocSphere</span>
                  <span className="text-xs font-semibold text-[#86868B]">ClinicOS</span>
                </h3>
                <p className="mt-1 text-xs text-[#86868B] dark:text-[#8E8E93]">
                  Direct doctor-patient operating layer with zero middleman markups.
                </p>

                <div className="mt-8 space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white mt-0.5">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <p className="text-sm font-bold text-[#1D1D1F] dark:text-white leading-snug">
                      Doctor keeps the full consultation fee
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white mt-0.5">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <p className="text-sm font-bold text-[#1D1D1F] dark:text-white leading-snug">
                      One clinic's own page — no rival ads
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white mt-0.5">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <p className="text-sm font-bold text-[#1D1D1F] dark:text-white leading-snug">
                      Prescription sent to you directly, sealed and verifiable
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white mt-0.5">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <p className="text-sm font-bold text-[#1D1D1F] dark:text-white leading-snug">
                      Listing order based on speciality match, not spend
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between">
                <span>Direct UPI / Cash to clinic counter</span>
                <span className="text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-sm">NMC & ABDM Ready</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
          5. HOW A BOOKING WORKS (4-STEP PROGRESSION)
      ===================================================================== */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8F9FB] dark:bg-[#090A0C]">
        <div className="mx-auto max-w-6xl">
          
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#008778] dark:text-[#34D399]">
              Patient Workflow
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
              How a booking works
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#86868B] dark:text-[#8E8E93]">
              Simple, transparent, and direct from search to sealed digital prescription.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* STEP 01 */}
            <div className="relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#18181B] flex flex-col justify-between group hover:border-[#0071E3]/40 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-[#0071E3] dark:text-[#2997FF] tracking-tight">
                    01
                  </span>
                  <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#0071E3]">
                    <Search className="h-4 w-4" />
                  </div>
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#1D1D1F] dark:text-white">
                  Pick a speciality
                </h3>

                <p className="mt-2 text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  Browse by condition or search a doctor's clinic page directly.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 text-[11px] font-medium text-[#86868B]">
                30+ clinical categories
              </div>
            </div>

            {/* STEP 02 */}
            <div className="relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#18181B] flex flex-col justify-between group hover:border-[#0071E3]/40 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-[#0071E3] dark:text-[#2997FF] tracking-tight">
                    02
                  </span>
                  <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#0071E3]">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#1D1D1F] dark:text-white">
                  Choose a slot
                </h3>

                <p className="mt-2 text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  See real-time availability — pre-booked or walk-in token.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 text-[11px] font-medium text-[#86868B]">
                Live queue position sync
              </div>
            </div>

            {/* STEP 03 */}
            <div className="relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#18181B] flex flex-col justify-between group hover:border-[#0071E3]/40 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-[#0071E3] dark:text-[#2997FF] tracking-tight">
                    03
                  </span>
                  <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#1D1D1F] dark:text-white">
                  Pay the clinic
                </h3>

                <p className="mt-2 text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  UPI online or pay at the clinic — no platform fee either way.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 font-semibold">
                Direct to doctor's bank / cash
              </div>
            </div>

            {/* STEP 04 */}
            <div className="relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#18181B] flex flex-col justify-between group hover:border-[#0071E3]/40 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-[#0071E3] dark:text-[#2997FF] tracking-tight">
                    04
                  </span>
                  <div className="h-8 w-8 rounded-full bg-green-50 dark:bg-green-950/50 flex items-center justify-center text-green-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#1D1D1F] dark:text-white">
                  Get your prescription
                </h3>

                <p className="mt-2 text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  A sealed digital prescription, delivered straight to WhatsApp.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 text-[11px] font-medium text-green-600 dark:text-green-400 font-semibold">
                SHA-256 sealed & verified
              </div>
            </div>

          </div>

          {/* Bottom Action Card */}
          <div className="mt-12 rounded-3xl bg-gradient-to-r from-[#0071E3] to-[#00A389] p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">
                Ready to consult an independent specialist?
              </h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
                Browse our verified practitioners in the Dehradun pilot network or search by your symptoms.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/search"
                className="rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-bold text-[#0071E3] hover:bg-white/90 active:scale-95 transition shadow-sm"
              >
                Find Doctors Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. CLINICAL EXPERTISE & SPECIALTIES GUIDE (DOCSPHERE CLINICAL NETWORK)
      ===================================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0B0C0E] border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-6xl">
          
          {/* Main Title & Intro */}
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#008778] dark:text-[#34D399]">
              Comprehensive Clinical Guide
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
              DocSphere Specialities — Clinical Expertise You Can Trust
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
              A clinical specialty represents dedicated medical training focusing on specific organ systems, pathologies, and surgical procedures. DocSphere connects you directly with certified specialists across verified local OPD clinics with zero middleman markup.
            </p>
            <p className="mt-2 text-sm sm:text-base font-semibold text-[#1D1D1F] dark:text-white">
              DocSphere features verified practitioners across essential medical specialities, including:
            </p>
          </div>

          {/* 12 Detailed Specialties Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            
            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-[#161618]">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008778]" />
                Dermatology & Cosmetology
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Expert care for skin, hair, and nail conditions. Encompasses clinical evaluations for acne, eczema, fungal infections, hair loss, psoriasis, and non-invasive cosmetic treatments.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-[#161618]">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008778]" />
                Obstetrics and Gynaecology
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Dedicated healthcare across all stages of women’s reproductive health. Encompasses comprehensive prenatal checkups, high-risk pregnancy guidance, PCOS/PCOD management, and fertility advice.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-[#161618]">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008778]" />
                General Medicine / Physician
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Board-certified physicians offering primary medical consultations, viral fever triage, preventive health checks, and ongoing medical management for hypertension and lifestyle diseases.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-[#161618]">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008778]" />
                Paediatrics & Child Health
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Focused medical care for infants, young children, and adolescents. Specializes in developmental milestones, vaccination schedules, nutritional guidance, and pediatric infections.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-[#161618]">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008778]" />
                Psychiatry & Behavioral Health
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Compassionate, evidence-based care for emotional and psychological well-being. Focuses on clinical management of anxiety, depression, sleep disorders, panic attacks, and chronic stress.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-[#161618]">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008778]" />
                Neurology
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Specialized diagnosis and treatment of conditions affecting the brain, spine, and nervous system. Covers chronic migraines, neuropathy, tremors, epilepsy, and post-stroke recovery.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-[#161618]">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008778]" />
                Endocrinology & Diabetology
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Targeted diagnosis and hormone therapy for the endocrine glands. Encompasses thyroid disorders, Type 1 & 2 diabetes management, insulin dose adjustment, and metabolic health.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-[#161618]">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008778]" />
                Cardiology & Heart Care
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Comprehensive cardiovascular health assessments. Covers hypertension regulation, chest discomfort evaluations, lipid profile review, ECG interpretation, and preventive cardiac wellness.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-[#161618]">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008778]" />
                Gastroenterology / GI Medicine
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Clinical diagnosis and care for the digestive tract, stomach, intestines, liver, and pancreas. Manages chronic acidity, fatty liver, irritable bowel syndrome, and digestive discomfort.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-[#161618]">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008778]" />
                Pulmonology & Chest Medicine
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Dedicated pulmonary care for respiratory tract and lung conditions. Expert treatment for persistent cough, asthma, allergic bronchitis, COPD, and post-viral breathing difficulty.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-[#161618]">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008778]" />
                Orthopaedics & Joint Care
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Specialized clinical management for musculoskeletal conditions and injuries. Covers arthritis therapy, sports injury rehabilitation, fracture care, slip disc, and joint pain relief.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-[#161618]">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#008778]" />
                Family Physician & Primary Care
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Continuous, holistic healthcare for patients of all ages. Coordinates chronic illness monitoring, family preventive screenings, vaccine schedules, and timely specialty referrals.
              </p>
            </div>

          </div>

          {/* Why Choose DocSphere Consultation */}
          <div className="mt-14 rounded-3xl border border-gray-200/90 bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 sm:p-8 dark:border-white/10 dark:from-[#161618] dark:to-[#121214]">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
              Why Consult Through DocSphere?
            </h3>
            <p className="mt-3 text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
              Experience transparent clinical care without waiting hours in crowded reception halls or paying aggregator booking surcharges. DocSphere connects patients directly with verified neighborhood clinics and independent practitioners.
            </p>

            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#008778] dark:text-[#34D399]">
                Key advantages of the DocSphere clinical network:
              </h4>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  "Verified NMC-registered specialists with published clinic fees",
                  "Real-time live queue counter — wait from home, not crowded rooms",
                  "Instant digital prescriptions delivered directly on WhatsApp",
                  "Direct clinic payment via UPI or cash with zero platform commissions",
                  "Prompt post-consult follow-up assistance and dosage guidance"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white p-3 border border-gray-100 dark:bg-white/5 dark:border-white/5 shadow-2xs">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#E5E5E7] leading-snug">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* When to Consult a Doctor */}
            <div className="mt-8 pt-6 border-t border-gray-200/80 dark:border-white/10">
              <h4 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                When to Consult a Specialist?
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                If your symptoms persist, require focused diagnostic workups, or your family doctor advises specialist intervention, booking a verified clinical consultation ensures timely attention. You can schedule direct OPD visits or quick triage with full medical record continuity.
              </p>
            </div>
          </div>

          {/* How to Consult a Doctor */}
          <div className="mt-8 rounded-3xl border border-gray-200/90 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#161618]">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
              How to Consult a Doctor?
            </h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#008778] dark:text-[#34D399]">
              Fast, Transparent Access to Verified Healthcare
            </p>
            <p className="mt-2 text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
              Prioritize your health with instant access to qualified specialists across verified OPD clinics. Enjoy personalized clinical care with direct doctor appointments, real-time waiting tokens, and tamper-proof digital prescriptions.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Online Consultation Steps */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 dark:border-blue-900/30 dark:bg-blue-950/15">
                <h4 className="text-sm font-bold text-[#0071E3] dark:text-[#2997FF] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0071E3] text-[11px] font-bold text-white">✓</span>
                  Steps to book an online consultation / triage:
                </h4>
                <ol className="mt-4 space-y-2.5 text-xs text-[#1D1D1F] dark:text-[#E5E5E7] font-medium">
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-[#0071E3] dark:text-[#2997FF]">1.</span> Choose the specialty or doctor
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-[#0071E3] dark:text-[#2997FF]">2.</span> Select your preferred consultation slot
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-[#0071E3] dark:text-[#2997FF]">3.</span> Complete direct appointment confirmation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-[#0071E3] dark:text-[#2997FF]">4.</span> Connect with the doctor on time
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-[#0071E3] dark:text-[#2997FF]">5.</span> Receive prescription & follow-up care on WhatsApp
                  </li>
                </ol>
              </div>

              {/* Offline Consultation Steps */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/15">
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">✓</span>
                  How to visit an in-person clinic through DocSphere:
                </h4>
                <ol className="mt-4 space-y-2.5 text-xs text-[#1D1D1F] dark:text-[#E5E5E7] font-medium">
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">1.</span> Select the medical specialist or clinic
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">2.</span> Book your live counter token online
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">3.</span> Track live queue status and arrive on schedule
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">4.</span> Pay consultation fees directly to the clinic
                  </li>
                </ol>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =====================================================================
          REDESIGNED FLOATING "BOOK CONSULT" ACTION BUTTON (SLEEK MODERN PILL)
      ===================================================================== */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-[#0071E3] via-[#008778] to-[#059669] p-1.5 pr-5 text-white shadow-2xl shadow-emerald-950/20 hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/25 backdrop-blur-md"
          title="Instant Voice Consult & Specialty Triage"
        >
          {/* Subtle ambient glow aura */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#0071E3] to-[#059669] opacity-40 blur-sm group-hover:opacity-80 transition" />

          {/* Circular Icon with Live Indicator Dot */}
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0071E3] shadow-md transition-transform duration-200 group-hover:rotate-6">
            <Mic className="h-5 w-5 text-[#008778]" />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          </div>

          {/* Label & Live Status */}
          <div className="relative text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Book Consult
              </span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-100">
                AI Voice
              </span>
            </div>
            <p className="text-[10px] font-medium text-white/90 leading-tight">
              Instant Triage • 0% Markup
            </p>
          </div>
        </button>
      </div>

      {/* =====================================================================
          7. MODAL: SPECIALTY DETAIL & DIRECT DOCTOR SELECTION
      ===================================================================== */}
      {selectedSpecialtyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.1]">
            <button
              onClick={() => setSelectedSpecialtyModal(null)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-gray-300 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4F6F8] p-2 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
                {React.createElement(selectedSpecialtyModal.icon)}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#008778] dark:text-[#34D399]">
                  {selectedSpecialtyModal.category}
                </span>
                <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white">
                  {selectedSpecialtyModal.name}
                </h3>
                <p className="text-xs text-[#86868B] mt-0.5">
                  {selectedSpecialtyModal.doctorCount} verified clinics in pilot network
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#86868B] dark:text-[#8E8E93]">
                Common Conditions Handled:
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedSpecialtyModal.popularConditions.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-[#1D1D1F] dark:bg-white/10 dark:text-white"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Check className="h-4 w-4" /> 100% Direct Clinic Pricing
              </div>
              <p className="text-xs text-emerald-700/90 dark:text-emerald-400 mt-1">
                Zero markup added. Consult fees typically range from ₹400 to ₹800 directly to the doctor via UPI or cash.
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/search?specialty=${encodeURIComponent(selectedSpecialtyModal.slug)}`}
                className="flex-1 rounded-full bg-[#0071E3] py-3 text-center text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] transition"
              >
                View Available Doctors
              </Link>
              <Link
                href={`/book?specialty=${encodeURIComponent(selectedSpecialtyModal.slug)}`}
                className="flex-1 rounded-full border border-gray-300 py-3 text-center text-xs font-semibold text-[#1D1D1F] hover:bg-gray-50 dark:border-white/20 dark:text-white dark:hover:bg-white/5 transition"
              >
                Book Instant Token
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          8. MODAL: AI VOICE CONSULT & SPECIALTY TRIAGE
      ===================================================================== */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.1]">
            <button
              onClick={() => setIsVoiceModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-gray-300 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-[#EA580C] dark:bg-orange-950/60 dark:text-orange-400">
                <Mic className="h-8 w-8 animate-pulse" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-[#1D1D1F] dark:text-white">
                Quick Consult & Triage
              </h3>
              <p className="mt-1 text-xs text-[#86868B] dark:text-[#8E8E93]">
                Describe your symptoms in natural language (Hindi or English), and DocSphere will direct you to the exact specialist.
              </p>
            </div>

            <div className="mt-6">
              <textarea
                rows={3}
                placeholder="e.g., 'Mild fever with skin rashes and joint pain for the last 2 days...'"
                value={voiceQuery}
                onChange={(e) => setVoiceQuery(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 p-3 text-xs sm:text-sm text-[#1D1D1F] focus:border-[#0071E3] focus:outline-none dark:border-white/15 dark:bg-[#2C2C2E] dark:text-white"
              />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={`/search?query=${encodeURIComponent(voiceQuery || "specialist")}`}
                className="w-full rounded-full bg-gradient-to-r from-[#EA580C] to-[#C2410C] py-3 text-center text-xs font-bold text-white shadow-sm hover:opacity-95 transition"
              >
                Match with Specialist
              </Link>
              <button
                type="button"
                onClick={() => {
                  setVoiceQuery("Severe toothache with sensitivity while chewing");
                }}
                className="text-[11px] text-[#0071E3] font-medium hover:underline py-1 text-center"
              >
                Try sample: "Severe toothache with sensitivity"
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
