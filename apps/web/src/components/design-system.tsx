"use client";

import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// ─────────────────────────────────────────────────────────
// Design Tokens (ClinicOS — Linear / Apple Health Inspired)
// Precision, information density, restrained shadows & borders
// ─────────────────────────────────────────────────────────

export const DESIGN_TOKENS = {
  colors: {
    primary: "#0071E3",
    primaryHover: "#0077ED",
    primaryLight: "bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#2997FF]/15 dark:text-[#2997FF]",
    secondary: "#64748B",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    surface: "bg-[#F8F9FA] dark:bg-[#0C0D0E]",
    surfaceCard: "bg-white dark:bg-[#151618]",
    surfaceElevated: "bg-white dark:bg-[#1A1B1E]",
    textPrimary: "text-slate-900 dark:text-slate-100",
    textSecondary: "text-slate-600 dark:text-slate-400",
    textMuted: "text-slate-500 dark:text-slate-500",
    border: "border-slate-200 dark:border-white/[0.08]",
    borderFocus: "focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3] dark:focus:ring-[#2997FF]/20 dark:focus:border-[#2997FF]",
  },
  radius: {
    xs: "rounded",
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
    xl: "rounded-2xl",
    full: "rounded-full",
  },
  shadow: {
    xs: "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
    sm: "shadow-sm",
    md: "shadow-[0_2px_6px_rgba(0,0,0,0.05)]",
    lg: "shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
  },
} as const;

// ─────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-[#0071E3] text-white hover:bg-[#0077ED] shadow-sm font-semibold active:scale-[0.99]",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80 dark:bg-white/[0.06] dark:text-slate-200 dark:border-white/[0.08] dark:hover:bg-white/[0.1] active:scale-[0.99]",
  outline:
    "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.1] dark:bg-[#151618] dark:text-slate-200 dark:hover:bg-[#1E2024] active:scale-[0.99]",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white active:scale-[0.99]",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 shadow-sm font-semibold active:scale-[0.99]",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm font-semibold active:scale-[0.99]",
};

const SIZE_STYLES: Record<"sm" | "md" | "lg", string> = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5",
  md: "px-3.5 py-2 text-xs font-medium gap-2",
  lg: "px-4 py-2.5 text-sm font-medium gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center
        ${DESIGN_TOKENS.radius.md}
        transition-colors duration-150
        disabled:opacity-50 disabled:pointer-events-none cursor-pointer
        ${VARIANT_STYLES[variant]}
        ${SIZE_STYLES[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {leftIcon && !isLoading && <span className="flex-shrink-0">{leftIcon}</span>}
      {!isLoading && props.children}
      {rightIcon && !isLoading && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────

interface CardProps extends PropsWithChildren {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

export function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
}: CardProps) {
  const PADDING_STYLES: Record<string, string> = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-5 sm:p-6",
  };

  const VARIANT_STYLES: Record<string, string> = {
    default: `${DESIGN_TOKENS.colors.surfaceCard} border ${DESIGN_TOKENS.colors.border} ${DESIGN_TOKENS.shadow.sm}`,
    elevated: `${DESIGN_TOKENS.colors.surfaceElevated} border border-slate-200/90 dark:border-white/[0.08] ${DESIGN_TOKENS.shadow.md}`,
    outlined: `bg-transparent border ${DESIGN_TOKENS.colors.border}`,
  };

  return (
    <div
      className={`
        ${DESIGN_TOKENS.radius.lg}
        ${VARIANT_STYLES[variant]}
        ${PADDING_STYLES[padding]}
        transition-colors duration-150
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helper,
  leftIcon,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          className={`
            w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 dark:border-white/[0.1] dark:bg-[#151618] dark:text-white
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none ${DESIGN_TOKENS.colors.borderFocus}
            disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-[#1A1B1E]
            transition-colors duration-150
            ${error ? "border-rose-500 focus:ring-rose-500/20" : ""}
            ${leftIcon ? "pl-9" : "pl-3"}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>
      )}
      {helper && !error && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helper}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  children: React.ReactNode;
  className?: string;
}

const BADGE_STYLES: Record<string, string> = {
  default: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:border-white/[0.08]",
  neutral: "bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-white/[0.05] dark:text-slate-400 dark:border-white/[0.08]",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
  warning: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
  danger: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40",
  info: "bg-blue-50 text-[#0071E3] border-blue-200/80 dark:bg-blue-950/40 dark:text-[#2997FF] dark:border-blue-800/40",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${BADGE_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const MODAL_SIZES: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative z-10 w-full ${MODAL_SIZES[size]} bg-white rounded-xl border border-slate-200 dark:bg-[#151618] dark:border-white/[0.1] shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] px-5 py-3.5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-white/[0.06] transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

const TOAST_STYLES: Record<string, string> = {
  success: "bg-slate-900 text-white border-slate-800 shadow-lg dark:bg-[#1E2024] dark:border-white/10",
  error: "bg-rose-950 text-white border-rose-800 shadow-lg",
  warning: "bg-amber-950 text-white border-amber-800 shadow-lg",
  info: "bg-slate-900 text-white border-slate-800 shadow-lg dark:bg-[#1E2024] dark:border-white/10",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  useEffect(() => {
    (window as any).__clinicosToast = toast;
  }, [toast]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-xs font-medium border animate-in slide-in-from-bottom-2 duration-150 ${
            TOAST_STYLES[t.type]
          }`}
        >
          {t.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
          {t.type === "error" && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
          <span className="leading-snug">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/70 dark:bg-white/[0.06] ${className}`}
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, icon, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-500">{icon}</span>}
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
