import type {
  ChatResponse,
  StateResponse,
  ApproveResponse,
} from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
    const msg =
      body?.error ?? body?.message ?? `Request failed with status ${status}`;
    super(msg);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export function sendChat(prompt: string): Promise<ChatResponse> {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

export function getState(): Promise<StateResponse> {
  return request("/ledger");
}

export function approveOrder(
  orderId: string,
  action: "capture" | "cancel"
): Promise<ApproveResponse> {
  return request("/approve", {
    method: "POST",
    body: JSON.stringify({ orderId, action }),
  });
}

export async function resetDemo(): Promise<void> {
  await request("/ledger/reset", { method: "POST" });
}

export function isQuotaError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 503 || err.status === 429);
}

export { ApiError };

