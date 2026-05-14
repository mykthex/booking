const rawApiBaseUrl = import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:9000";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
