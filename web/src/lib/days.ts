import type { Day, Variant } from "../types";

/** Блоки варианта → дни с номером и датой. Ось: своя у варианта, иначе общая. */
export function buildDays(variant: Variant | undefined, dates: string[]): Day[] {
  if (!variant) return [];
  const axis = variant.dates && variant.dates.length ? variant.dates : dates;
  return [...(variant.china ?? []), ...(variant.hk ?? [])].map((d, i) => ({
    ...d,
    n: i + 1,
    date: axis[i] ?? "",
  }));
}

export function dayByNum(days: Day[], n: number): Day | null {
  return days.find((d) => d.n === n) ?? null;
}

/** «1 ночь», «2 ночи», «5 ночей». */
export function nightsWord(n: number): string {
  const tail = n % 100;
  if (tail >= 11 && tail <= 14) return "ночей";
  const last = n % 10;
  if (last === 1) return "ночь";
  if (last >= 2 && last <= 4) return "ночи";
  return "ночей";
}

export interface RouteGroup {
  city: string;
  /** ночей в этом городе (последний отрезок теряет одну — ночь в самолёте) */
  nights: number;
  isLast: boolean;
}

/** Ночи выводятся из подряд идущих одинаковых городов; последний отрезок −1. */
export function routeGroups(days: Day[]): { groups: RouteGroup[]; total: number } {
  const groups: RouteGroup[] = [];
  for (const d of days) {
    const last = groups[groups.length - 1];
    if (last && last.city === d.city) last.nights += 1;
    else groups.push({ city: d.city, nights: 1, isLast: false });
  }
  groups.forEach((g, i) => {
    g.isLast = i === groups.length - 1;
    if (g.isLast) g.nights -= 1;
  });
  return { groups, total: days.length ? days.length - 1 : 0 };
}

/** Ключ дня в D1: «<вариант>|<ДД.ММ>» (дата из строки дня, иначе номер дня). */
export function noteKey(variantId: string, day: Pick<Day, "date" | "n">): string {
  const m = /(\d{2}\.\d{2})/.exec(day.date ?? "");
  return variantId + "|" + (m ? m[1] : "д" + day.n);
}

/** Диапазон дат варианта для карточки: «04.12–19.12». */
export function variantDateRange(variant: Variant, dates: string[]): string {
  const axis = variant.dates && variant.dates.length ? variant.dates : dates;
  if (!axis.length) return "";
  const lastDay = (variant.china?.length ?? 0) + (variant.hk?.length ?? 0) - 1;
  const last = axis[lastDay] ?? axis[axis.length - 1] ?? "";
  return axis[0].split(" · ")[0] + "–" + last.split(" · ")[0];
}
