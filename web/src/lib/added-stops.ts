import { stopSlug } from "./slug";
import type { DayTag, DayTextsMap, GuideItem, GuideKind, Stop } from "../types";

export interface AddedStop {
  s: string;
  n: string;
  t?: DayTag;
  k?: string;
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
const PLACE_RE = /^[a-z0-9_]{1,40}$/;

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
    const place = text(value.k, 40);
    if (place && PLACE_RE.test(place)) stop.k = place;
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
    k: a.k ?? "",
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

/** Текст заметки без HTML-тегов: одна строка для поля `add`. */
export function stripHtml(html?: string): string {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Карточка справочника в форме добавленной остановки. */
export function addedStopFromGuide(item: GuideItem): AddedStop {
  return {
    s: stopSlug(item.en),
    n: item.en,
    t: tagForGuideKind(item.kind),
    d: stripHtml(item.note).slice(0, 300) || undefined,
    g: item.id,
  };
}

/** Остановка дня в форме добавленной остановки (для переноса в другой день). */
export function addedStopFromStop(stop: Stop, slug: string, guideId: string): AddedStop {
  return {
    s: slug,
    n: stop.name ?? stop.title ?? "",
    t: stop.tag,
    c: stop.cost,
    d: stripHtml(stop.note).slice(0, 300),
    g: guideId || stop._guide,
    k: stop.k || undefined,
  };
}

function splitSlugs(value: string | undefined): string[] {
  return (value ?? "").split(",").filter((slug) => slug.length > 0);
}

function dropEmptyLists(texts: DayTextsMap): void {
  for (const field of ["add", "hide", "missed"]) {
    if (texts[field] === "") delete texts[field];
  }
}

export interface PlanStopMoveInput {
  fromTexts: DayTextsMap;
  toTexts: DayTextsMap;
  slug: string;
  added: AddedStop | null;
  hideInSource: boolean;
}

export interface PlanStopMoveResult {
  from: DayTextsMap;
  to: DayTextsMap;
  error?: "limit" | "duplicate";
}

/** Чистый план переноса остановки из одного дня в другой. */
export function planStopMove(input: PlanStopMoveInput): PlanStopMoveResult {
  const { slug, added, hideInSource } = input;
  const from: DayTextsMap = { ...input.fromTexts };
  const to: DayTextsMap = { ...input.toTexts };

  const targetAdded = parseAddedStops(to.add);
  if (targetAdded.some((item) => item.s === slug)) {
    return { from: input.fromTexts, to: input.toTexts, error: "duplicate" };
  }
  if (added && targetAdded.length >= 8) {
    return { from: input.fromTexts, to: input.toTexts, error: "limit" };
  }

  const sourceRest = parseAddedStops(from.add).filter((item) => item.s !== slug);
  if (sourceRest.length) from.add = serializeAddedStops(sourceRest);
  else delete from.add;

  if (hideInSource) {
    const hide = splitSlugs(from.hide);
    if (hide.indexOf(slug) === -1) hide.push(slug);
    from.hide = hide.join(",");
    from.missed = splitSlugs(from.missed)
      .filter((item) => item !== slug)
      .join(",");
  }

  to.hide = splitSlugs(to.hide)
    .filter((item) => item !== slug)
    .join(",");
  to.missed = splitSlugs(to.missed)
    .filter((item) => item !== slug)
    .join(",");

  if (added) {
    targetAdded.push(added);
    to.add = serializeAddedStops(targetAdded);
  }

  dropEmptyLists(from);
  dropEmptyLists(to);
  return { from, to };
}
