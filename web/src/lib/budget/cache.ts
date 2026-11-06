import { readJson, writeJson, STORAGE_KEYS } from "../storage";
import type { BudgetData, CachedBudget } from "./types";

export const BUDGET_CACHE_KEY = STORAGE_KEYS.budgetCache;

/** Последний успешный GET /api/budget — чтобы показать бюджет, пока грузится свежий. */
export function readBudgetCache(): CachedBudget | null {
  const parsed = readJson<unknown>(BUDGET_CACHE_KEY, null);
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as { at?: unknown; data?: unknown };
  const data = record.data as Partial<BudgetData> | null | undefined;
  if (!data || typeof data !== "object") return null;
  if (!data.params || typeof data.params !== "object") return null;
  if (!Array.isArray(data.categories) || !Array.isArray(data.items)) return null;
  return {
    at: Number.isFinite(record.at) ? Number(record.at) : Date.now(),
    data: data as BudgetData,
  };
}

export function writeBudgetCache(data: BudgetData): void {
  writeJson(BUDGET_CACHE_KEY, { at: Date.now(), data });
}
