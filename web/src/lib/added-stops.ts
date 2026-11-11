import type { DayTag, GuideKind, Stop } from "../types";

export interface AddedStop {
  s: string;
  n: string;
  t?: DayTag;
  c?: string;
  d?: string;
  g?: string;
}

const TAGS: DayTag[] = [
  "sight",
  "food",
  "transport",
  "hotel",
  "shopping",
  "spa",
  "festival",
  "optional",
];

const SLUG_RE = /^[a-z0-9]{4,10}$/;

function text(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

/** Терпимый разбор поля `add`: мусор и невалидные элементы пропускаются. */
export function parseAddedStops(raw: string | undefined | null): AddedStop[] {
  if (typeof raw !== "string" || raw.length === 0) return [];
  let list: unknown;
  try {
    list = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];

  const out: AddedStop[] = [];
  for (const item of list.slice(0, 8)) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) continue;
    const value = item as Record<string, unknown>;
    const slug = text(value.s, 10);
    const name = text(value.n, 160);
    if (!SLUG_RE.test(slug) || name.length === 0) continue;

    const stop: AddedStop = { s: slug, n: name };
    const tag = typeof value.t === "string" ? value.t.trim() : "";
    if ((TAGS as string[]).indexOf(tag) !== -1) stop.t = tag as DayTag;
    const cost = text(value.c, 40);
    if (cost) stop.c = cost;
    const description = text(value.d, 300);
    if (description) stop.d = description;
    const guide = text(value.g, 40);
    if (guide) stop.g = guide;
    out.push(stop);
  }
  return out;
}

/** Компактный JSON для хранения в поле `add`; пустой список сбрасывает поле. */
export function serializeAddedStops(list: AddedStop[]): string {
  if (!list.length) return "";
  return JSON.stringify(list);
}

/** Добавленная остановка в форме обычной остановки дня. */
export function addedStopToStop(a: AddedStop): Stop {
  return {
    k: "",
    name: a.n,
    tag: a.t ?? "sight",
    cost: a.c,
    note: a.d,
    _slug: a.s,
    _name: a.n,
    _guide: a.g,
    _added: true,
  };
}

/** Тег дня по виду карточки справочника. */
export function tagForGuideKind(kind: GuideKind): DayTag {
  if (kind === "food") return "food";
  if (kind === "stay") return "hotel";
  return "sight";
}
