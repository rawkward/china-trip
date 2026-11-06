/** Числовой ввод и форматирование, перенесённые из старого assets/budget.js. */

/** «1 200,50» → 1200.5; пустая строка и мусор → null. */
export function parseNumberInput(value: unknown): number | null {
  const text = String(value === undefined || value === null ? "" : value)
    .replace(/[\s\u00a0\u202f]/g, "")
    .replace(",", ".")
    .trim();
  if (text === "") return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

/** Число для controlled-поля без хвоста плавающей точки; scale — для процентов. */
export function displayNumber(value: unknown, scale = 1): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  const scaled = value * scale;
  return String(Math.round(scaled * 1_000_000) / 1_000_000);
}

export function compareSort<T extends { sort?: number; id: string }>(a: T, b: T): number {
  const sa = Number.isFinite(a.sort) ? (a.sort as number) : 0;
  const sb = Number.isFinite(b.sort) ? (b.sort as number) : 0;
  if (sa !== sb) return sa - sb;
  return String(a.id).localeCompare(String(b.id));
}

/** HH:MM из timestamp; NaN → «—». */
export function formatClock(ms: number): string {
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Курс ЦБ: всегда четыре знака после запятой, как в старой странице. */
export function formatRate(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function formatDateSeconds(seconds: number | null): string {
  if (!seconds) return "—";
  const date = new Date(Number(seconds) * 1000);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU");
}

export function formatDateIso(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ru-RU");
}
