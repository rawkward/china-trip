import type {
  AuthToken,
  DayNote,
  DayTextRecord,
  DayTextsMap,
  GuideTagRecord,
  GuideTagValue,
  StopNote,
} from "../types";

function resolveApiBase(): string {
  const fromGlobal = (globalThis as { BUDGET_CONFIG?: { API_BASE?: string } }).BUDGET_CONFIG;
  const fromWindow =
    typeof window !== "undefined"
      ? (window as unknown as { __TRIP_API_BASE__?: string }).__TRIP_API_BASE__
      : undefined;
  if (typeof fromWindow === "string" && fromWindow) return fromWindow;
  if (fromGlobal && typeof fromGlobal.API_BASE === "string" && fromGlobal.API_BASE) {
    return fromGlobal.API_BASE;
  }
  return "https://china-trip-api.pages.dev";
}

export const API_BASE = resolveApiBase();

export interface ApiDetail {
  field?: string;
  message?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details: ApiDetail[];

  constructor(status: number, message: string, details: ApiDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  base?: string;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, signal, base = API_BASE } = options;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = "Bearer " + token;

  let res: Response;
  try {
    res = await fetch(base + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError(0, "нет связи с сервером");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const payload = data as { details?: ApiDetail[]; error?: string } | null;
    const detail = payload?.details?.[0]?.message;
    const message =
      detail || payload?.error || "ошибка " + res.status;
    throw new ApiError(res.status, message, payload?.details ?? []);
  }
  return data as T;
}

export const api = {
  async login(password: string): Promise<AuthToken> {
    const data = await request<{ token: string; expires_at: number }>("/api/login", {
      method: "POST",
      body: { password },
    });
    return { token: data.token, expiresAt: data.expires_at };
  },

  listDayNotes: (signal?: AbortSignal) =>
    request<{ notes: DayNote[] }>("/api/day-notes", { signal }).then((d) => d.notes ?? []),
  putDayNote: (key: string, body: string, token: string) =>
    request<{ note: DayNote | null }>("/api/day-notes/" + encodeURIComponent(key), {
      method: "PUT",
      body: { body },
      token,
    }).then((d) => d.note ?? null),
  deleteDayNote: (key: string, token: string) =>
    request<unknown>("/api/day-notes/" + encodeURIComponent(key), { method: "DELETE", token }),

  listStopNotes: (signal?: AbortSignal) =>
    request<{ notes: StopNote[] }>("/api/stop-notes", { signal }).then((d) => d.notes ?? []),
  putStopNote: (key: string, body: string, token: string) =>
    request<{ note: StopNote | null }>("/api/stop-notes/" + encodeURIComponent(key), {
      method: "PUT",
      body: { body },
      token,
    }).then((d) => d.note ?? null),
  deleteStopNote: (key: string, token: string) =>
    request<unknown>("/api/stop-notes/" + encodeURIComponent(key), { method: "DELETE", token }),

  listDayTexts: (signal?: AbortSignal) =>
    request<{ notes: DayTextRecord[] }>("/api/day-texts", { signal }).then((d) => d.notes ?? []),
  putDayTexts: (key: string, texts: DayTextsMap, token: string) =>
    request<{ note: DayTextRecord | null }>("/api/day-texts/" + encodeURIComponent(key), {
      method: "PUT",
      body: { texts },
      token,
    }).then((d) => (d.note?.texts ?? null) as DayTextsMap | null),

  listGuideTags: (signal?: AbortSignal) =>
    request<{ tags: GuideTagRecord[] }>("/api/guide-tags", { signal }).then((d) => d.tags ?? []),
  putGuideTag: (key: string, tag: GuideTagValue, token: string) =>
    request<{ tag: GuideTagRecord | null }>("/api/guide-tags/" + encodeURIComponent(key), {
      method: "PUT",
      body: { tag },
      token,
    }).then((d) => d.tag ?? null),
};
