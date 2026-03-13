// Prefer same-origin API (via Next rewrites) for production so cookies work with middleware.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

type ApiError = {
  detail?: string;
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const part = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  if (!part) return null;
  return decodeURIComponent(part.split("=").slice(1).join("="));
}

function isSafeMethod(method: string) {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const csrfToken = !isSafeMethod(method) ? getCookie("csrf_token") : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...(init.headers ?? {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as ApiError;
      if (data?.detail) message = data.detail;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}
