const browserApiBaseUrl = import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:9000";

// Use localhost for SSR in local dev, and server:8080 only if PUBLIC_INTERNAL_API_BASE_URL is set in Docker Compose
const serverApiBaseUrl =
  import.meta.env.PUBLIC_INTERNAL_API_BASE_URL ||
  "http://localhost:9000";

const rawApiBaseUrl = import.meta.env.SSR ? serverApiBaseUrl : browserApiBaseUrl;

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
