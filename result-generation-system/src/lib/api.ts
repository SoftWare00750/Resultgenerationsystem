/**
 * lib/api.ts
 * Thin fetch wrapper used by all services (auth, students, results, classes,
 * sessions, school). Handles JWT storage and attaches the Authorization
 * header automatically unless `skipAuth` is passed.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';

const TOKEN_KEY = 'rgs_auth_token';

// ─── Token helpers ──────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
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
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!options.skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Could not reach the API server at ${API_BASE_URL}. Check that NEXT_PUBLIC_API_URL is set and the backend is running.`,
      0
    );
  }

  // Handle empty responses (e.g. 204 No Content from DELETE)
  const text = await res.text();

  // If the backend URL is misconfigured, fetch often resolves to an HTML
  // 404/500 page instead of JSON. Detect that explicitly instead of letting
  // JSON.parse throw a confusing "Unexpected token '<'" error.
  const looksLikeHtml = text.trim().startsWith('<');
  if (looksLikeHtml) {
    throw new ApiError(
      `API request to ${API_BASE_URL}${path} returned an HTML page instead of JSON (status ${res.status}). ` +
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
        `API at ${API_BASE_URL}${path} returned a non-JSON response (status ${res.status}).`,
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
    request<T>('GET', path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),

  del: <T = void>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};

export default api;