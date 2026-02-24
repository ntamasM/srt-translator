/**
 * Thin fetch wrapper with base URL and typed JSON helpers.
 */

import { API_BASE_URL } from "../utils/constants";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = body.detail || body.message || msg;
    } catch {}
    throw new ApiError(msg, res.status);
  }
  return res.json() as Promise<T>;
}

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  return handleResponse<T>(res);
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function put<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" });
  return handleResponse<T>(res);
}

export async function upload<T>(path: string, files: File[]): Promise<T> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: form,
  });
  return handleResponse<T>(res);
}

export { ApiError };
