/** Курс ЦБ: чтение фикстуры daily_json.js и сравнение с сохранённым курсом. */

export const CBR_DAILY_URL = "https://www.cbr-xml-daily.ru/daily_json.js";

interface CbrEntry {
  Value?: unknown;
  Nominal?: unknown;
}

interface CbrDocument {
  Valute?: Record<string, CbrEntry | undefined> | null;
  Date?: unknown;
}

/** Из документа ЦБ достаёт рублёвую цену одной единицы валюты (Value / Nominal). */
export function readCbrRate(data: unknown, code: string): number | null {
  const doc = data as CbrDocument | null | undefined;
  const entry = doc?.Valute?.[code];
  if (!entry) return null;
  const value = Number(entry.Value);
  const nominal = Number(entry.Nominal);
  if (!Number.isFinite(value) || !Number.isFinite(nominal) || nominal <= 0) return null;
  return value / nominal;
}

export function readCbrDate(data: unknown): string {
  const doc = data as CbrDocument | null | undefined;
  return typeof doc?.Date === "string" ? doc.Date : "";
}

/** Курс предлагаем обновить только если он отличается больше чем на 0,1 %. */
export function rateDiffers(stored: unknown, fetched: unknown): boolean {
  const a = Number(stored);
  const b = Number(fetched);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  if (a === 0) return b !== 0;
  return Math.abs(b - a) / Math.abs(a) > 0.001;
}
