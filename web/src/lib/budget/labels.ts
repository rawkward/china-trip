/** Подписи городов и прочая текстовая мелочь бюджета. */

export const CITY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  cq: "Чунцин",
  zzj: "Чжанцзяцзе",
  fr: "Фужун",
  hk: "Гонконг",
});

export function cityLabel(prefix: string): string {
  const known = CITY_LABELS[prefix];
  if (known) return known;
  const text = String(prefix).replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function itemWord(count: number): string {
  const n = Math.abs(Math.trunc(Number(count) || 0));
  const tail100 = n % 100;
  if (tail100 >= 11 && tail100 <= 14) return "статей";
  const last = n % 10;
  if (last === 1) return "статья";
  if (last >= 2 && last <= 4) return "статьи";
  return "статей";
}

/** Префикс нового города: латиница, цифры и _, начинается с буквы, влезает в PARAM_KEY_RE. */
export function cityPrefixError(prefix: string, existing: string[] = []): string | null {
  const value = prefix.trim().toLowerCase();
  if (!value) return "Укажите код города";
  if (!/^[a-z][a-z0-9_]{0,20}$/.test(value)) {
    return "Латиница, цифры и _, начиная с буквы";
  }
  if (existing.includes(value)) return "Такой город уже есть";
  return null;
}
