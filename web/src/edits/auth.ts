import { useSyncExternalStore } from "react";
import { api, ApiError } from "../api/client";
import { readString, removeKey, writeString, STORAGE_KEYS } from "../lib/storage";

export interface AuthState {
  token: string | null;
  expiresAt: number;
}

function readStored(): AuthState {
  const token = readString(STORAGE_KEYS.token);
  const exp = Number(readString(STORAGE_KEYS.tokenExp));
  if (!token || !Number.isFinite(exp) || exp * 1000 <= Date.now()) {
    return { token: null, expiresAt: 0 };
  }
  return { token, expiresAt: exp };
}

let state: AuthState = readStored();
const listeners = new Set<() => void>();

function emit(next: AuthState) {
  state = next;
  for (const fn of listeners) fn();
}

export function getAuth(): AuthState {
  return state;
}

export function subscribeAuth(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setAuth(token: string, expiresAt: number): void {
  writeString(STORAGE_KEYS.token, token);
  writeString(STORAGE_KEYS.tokenExp, String(expiresAt));
  emit({ token, expiresAt });
}

export function clearAuth(): void {
  removeKey(STORAGE_KEYS.token);
  removeKey(STORAGE_KEYS.tokenExp);
  emit({ token: null, expiresAt: 0 });
}

/** Текст ошибки входа — те же формулировки, что у старой страницы. */
export async function loginWithPassword(password: string): Promise<void> {
  if (!password) throw new Error("введите пароль");
  try {
    const auth = await api.login(password);
    setAuth(auth.token, auth.expiresAt);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 403) throw new Error("неверный пароль");
      if (err.status === 429) throw new Error("слишком много попыток, подождите 15 минут");
      if (err.status === 0) throw new Error("нет связи с сервером");
      throw new Error("вход не удался (" + err.status + ")");
    }
    throw err;
  }
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribeAuth, getAuth, getAuth);
}

export function useToken(): string | null {
  return useAuth().token;
}
