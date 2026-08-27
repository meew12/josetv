// Cliente API helper para el frontend
import { useAuth } from "./auth-store";

const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuth.getState().user?.token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || data.message || "Error desconocido", res.status);
  }
  return data as T;
}

export const api = {
  get: <T = any>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body || {}) }),
  put: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body || {}) }),
  delete: <T = any>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
