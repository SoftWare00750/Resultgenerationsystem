/**
 * lib/api.ts
 * Thin fetch wrapper used by all services (auth, students, results, classes,
 * sessions, school). Handles JWT storage and attaches the Authorization
 * header automatically unless `skipAuth` is passed.
 */

const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "") ||
  (typeof window !== "undefined"
    ? window.location.origin + "/api"
    : "/api");

const TOKEN_KEY = "rgs_auth_token";

// ─── Token helpers ──────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Core request helper ────────────────────────────────────────────────────

interface RequestOptions {
  skipAuth?: boolean;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!options.skipAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err: any) {
    // Network-level failure — could be SSL cert issue, DNS, refused connection, or CORS
    const msg = err?.message ?? String(err);

    // Provide a helpful message for SSL-related failures
    const sslHint =
      msg.toLowerCase().includes("certificate") ||
      msg.toLowerCase().includes("ssl") ||
      msg.toLowerCase().includes("self-signed")
        ? " This looks like an SSL certificate error — make sure the backend is running with a valid certificate or that NODE_TLS_REJECT_UNAUTHORIZED is not blocking the connection."
        : "";

    throw new ApiError(
      `Could not reach the API server at ${API_BASE_URL}. ` +
        `Check that NEXT_PUBLIC_API_URL is set correctly and that the backend is running.` +
        `${sslHint} Original error: ${msg}`,
      0
    );
  }

  // Handle empty responses (e.g. 204 No Content from DELETE)
  const text = await res.text();

  // Detect HTML error pages (misconfigured proxy / wrong URL)
  const looksLikeHtml = text.trim().startsWith("<");
  if (looksLikeHtml) {
    throw new ApiError(
      `API request to ${url} returned an HTML page instead of JSON (status ${res.status}). ` +
        `This usually means NEXT_PUBLIC_API_URL is missing or pointing at the wrong server.`,
      res.status
    );
  }

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(
        `API at ${url} returned a non-JSON response (status ${res.status}).`,
        res.status
      );
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),

  del: <T = void>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};

export default api;