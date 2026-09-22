/**
 * Centralized API configuration for a real-world deployment.
 *
 * We intentionally avoid hard-coding localhost as the default production path.
 * For Vercel + Supabase deployments, the app should use environment variables.
 * If the runtime is local-only, we provide a safe localhost fallback.
 */
const normalizeBaseUrl = (value?: string): string => {
  if (!value) return "";
  return value.replace(/\/$/, "");
};

export const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL
);

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export const isSupabaseReady = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("clinicos_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

