/**
 * Centralized API Base URL configuration.
 * Uses NEXT_PUBLIC_API_URL when deployed or configured on clinic LAN,
 * falling back to localhost:8000 for local development.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};
