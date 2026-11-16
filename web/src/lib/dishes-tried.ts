import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "china-trip:dishes-tried:v1";

function readTried(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function writeTried(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* приватный режим или jsdom без хранилища — молча теряем отметки */
  }
}

/** Отметки «уже попробовали» для блюд: живут только в этом браузере. */
export function useTriedDishes() {
  const [tried, setTried] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setTried(new Set(readTried()));
  }, []);

  const toggle = useCallback((id: string) => {
    setTried((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeTried([...next]);
      return next;
    });
  }, []);

  return { tried, toggle };
}
