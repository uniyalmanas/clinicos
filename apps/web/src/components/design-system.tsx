"use client";

import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { X, CheckCircle2, AlertCircle, Loader2, Plus, Bell } from "lucide-react";

// ─────────────────────────────────────────────────────────
// Design Tokens (Clinic OS)
// Single source of truth for colors, spacing, radius, shadows.
// Every page should use these classes so the UI feels unified.
// ─────────────────────────────────────────────────────────

export const DESIGN_TOKENS = {
  colors: {
    primary: "#0071E3",
    primaryHover: "#0077ED",
    primaryLight: "bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#2997FF]/20 dark:text-[#2997FF]",
    secondary: "#6E6E73",
    success: "#30D158",
    warning: "#FF9F0A",
    danger: "#FF453A",
    surface: "bg-[#ECEEF2] dark:bg-black",
    surfaceCard: "bg-white dark:bg-[#1C1C1E]",
    surfaceElevated: "bg-white dark:bg-[#2C2C2E]",
    textPrimary: "text-[#1D1D1F] dark:text-[#F5F5F7]",
    textSecondary: "text-[#6E6E73] dark:text-[#A1A1A6]",
    textMuted: "text-[#86868B] dark:text-[#636366]",
    border: "border-black/[0.06] dark:border-white/[0.08]",
    borderFocus: "focus:ring-4 focus:ring-[#0071E3]/20 dark:focus:ring-[#2997FF]/20",
  },
  radius: {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
    full: "rounded-full",
  },
  shadow: {
    sm: "shadow-sm",
    md: "shadow-apple-sm",
    lg: "shadow-apple-card",
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
    "bg-[#0071E3] text-white shadow-[#0071E3]/30 hover:bg-[#0077ED] active:scale-95",
  secondary:
    "bg-[#F5F6F9] text-[#1D1D1F] hover:bg-[#ECEEF2] dark:bg-[#2C2C2E] dark:text-white dark:hover:bg-[#1C1C1E] active:scale-95",
  outline:
    "border border-black/[0.08] bg-white text-[#1D1D1F] hover:bg-[#ECEEF2] dark:border-white/[0.08] dark:bg-[#2C2C2E] dark:text-white dark:hover:bg-[#1C1C1E] active:scale-95",
  ghost:
    "bg-transparent text-[#6E6E73] hover:bg-[#ECEEF2] dark:text-[#A1A1A6] dark:hover:bg-[#1C1C1E] active:scale-95",
  danger:
    "bg-[#FF453A] text-white hover:bg-[#FF574D] shadow-[#FF453A]/30 active:scale-95",
  success:
    "bg-[#30D158] text-white hover:bg-[#34E061] shadow-[#30D158]/30 active:scale-95",
};

const SIZE_STYLES: Record<"sm" | "md" | "lg", string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
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
        inline-flex items-center justify-center gap-2
        ${DESIGN_TOKENS.radius.md}
        ${DESIGN_TOKENS.shadow.md}
        font-bold transition-all duration-200
        disabled:opacity-50 disabled:pointer-events-none
        ${VARIANT_STYLES[variant]}
        ${SIZE_STYLES[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      {leftIcon && !isLoading && (
        <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {!isLoading && props.children}
      {rightIcon && !isLoading && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
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
    lg: "p-6",
  };

  const VARIANT_STYLES: Record<string, string> = {
    default: `${DESIGN_TOKENS.colors.surfaceCard} ${DESIGN_TOKENS.colors.border}`,
    elevated: `${DESIGN_TOKENS.colors.surfaceElevated} ${DESIGN_TOKENS.shadow.lg}`,
    outlined: `${DESIGN_TOKENS.colors.border} bg-transparent`,
  };

  return (
    <div
      className={`
        ${DESIGN_TOKENS.radius.lg}
        ${VARIANT_STYLES[variant]}
        ${PADDING_STYLES[padding]}
        transition-all duration-200 hover:shadow-lg
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
    <div className="space-y-1 w-full">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B] dark:text-[#636366]">
            {leftIcon}
          </span>
        )}
        <input
          className={`
            w-full rounded-xl border bg-white px-3 py-2.5 pl-9 text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white
            focus:outline-none ${DESIGN_TOKENS.colors.borderFocus}
            disabled:bg-[#F5F6F9] dark:disabled:bg-[#2C2C2E]
            ${error ? "border-[#FF453A] focus:ring-[#FF453A]/20" : ""}
            ${leftIcon ? "pl-9" : "pl-3"}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-[#FF453A] dark:text-[#FF6B6B]">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-[#86868B] dark:text-[#636366]">{helper}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}

const BADGE_STYLES: Record<string, string> = {
  default: "bg-[#ECEEF2] text-[#6E6E73] dark:bg-[#2C2C2E] dark:text-[#A1A1A6]",
  success: "bg-[#30D158]/10 text-[#30D158] dark:bg-[#30D158]/20 dark:text-[#34E061]",
  warning: "bg-[#FF9F0A]/10 text-[#FF9F0A] dark:bg-[#FF9F0A]/20 dark:text-[#FFB34D]",
  danger: "bg-[#FF453A]/10 text-[#FF453A] dark:bg-[#FF453A]/20 dark:text-[#FF6B6B]",
  info: "bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#2997FF]/20 dark:text-[#2997FF]",
};

export function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${BADGE_STYLES[variant]}`}
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
  xl: "max-w-xl",
};

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative z-10 w-full ${MODAL_SIZES[size]} bg-white rounded-3xl border border-white/[0.08] dark:bg-[#1C1C1E] dark:border-white/[0.08] shadow-2xl animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] px-6 py-4">
            <h3 className="font-bold text-[#1D1D1F] dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[#86868B] hover:bg-[#ECEEF2] dark:text-[#A1A1A6] dark:hover:bg-[#1C1C1E] transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
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
  success: "bg-[#1D1D1F] text-white border border-white/10 shadow-2xl",
  error: "bg-[#FF453A]/10 border border-[#FF453A]/20 text-[#FF453A] shadow-2xl",
  warning: "bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 text-[#FF9F0A] shadow-2xl",
  info: "bg-[#0071E3]/10 border border-[#0071E3]/20 text-[#0071E3] shadow-2xl",
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

  // Expose toast globally for components that need it
  useEffect(() => {
    (window as any).__clinicosToast = toast;
  }, [toast]);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-bold shadow-2xl border animate-in fade-in duration-200 ${
            TOAST_STYLES[t.type]
          }`}
        >
          {t.type === "success" && (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          {t.type === "error" && (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{t.message}</span>
          <button
            onClick={() =>
              setToasts((prev) => prev.filter((x) => x.id !== t.id))
            }
            className="ml-2 opacity-60 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
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
      className={`animate-pulse rounded-lg bg-[#ECEEF2] dark:bg-[#2C2C2E] ${className}`}
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {icon && <span>{icon}</span>}
          <h2 className="text-xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
