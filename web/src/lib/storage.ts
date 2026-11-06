/** Безопасная работа с localStorage: приватный режим и отключённое хранилище не падают. */

export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* приватный режим — молча теряем */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readString(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    writeString(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

export const STORAGE_KEYS = {
  variant: "china-trip-variant-v5",
  checklist: "china-trip-checklist-v1",
  token: "chinatrip.budget.token",
  tokenExp: "chinatrip.budget.token_exp",
} as const;
