import { guideItemByKey } from "./guide";
import { addedStopToStop, parseAddedStops } from "./added-stops";
import { stopSlug } from "./slug";
import type { Day, DayTextsMap, GuideItem, Pick, Stop } from "../types";

/** Значение правки поля, если она есть; иначе null. */
export function dayTextValue(texts: DayTextsMap, field: string): string | null {
  const t = texts ?? {};
  const has = Object.prototype.hasOwnProperty.call(t, field);
  return has ? t[field] : null;
}

function applyRef(
  q: Stop,
  texts: DayTextsMap,
  slug: string,
  items: GuideItem[],
  nameField: "name" | "title",
): GuideItem | null {
  const ref = texts["ref:" + slug];
  if (!ref) return null;
  const item = guideItemByKey(items, ref);
  if (!item) return null;
  if (item.en) q[nameField] = item.en;
  q.note = item.note ?? "";
  q.cost = "";
  return item;
}

/**
 * Накладывает слой правок текста на день: заголовок, подзаголовок, тексты
 * остановок, порядок остановок, замену на карточку справочника.
 * Исходные значения сохраняются в `_title` / `_name` — по ним адресуются правки.
 */
export function withTexts(
  day: Day,
  texts: DayTextsMap,
  items: GuideItem[],
): Day {
  const t = texts ?? {};
  const has = (field: string) => Object.prototype.hasOwnProperty.call(t, field);

  const out: Day = { ...day, places: [] };
  out._title = day.title;
  out._sub = day.sub;
  if (has("title")) out.title = t.title;
  if (has("sub")) out.sub = t.sub;

  out.places = (day.places ?? []).map((p) => {
    const q: Stop = { ...p };

    if (p.picks && p.picks.length) {
      const slug = stopSlug(p.title || p.name || "");
      q._slug = slug;
      q._title = p.title;
      q._name = p.name;
      const base = "picks:" + slug;
      if (has(base + ":title")) q.title = t[base + ":title"];
      if (has(base + ":note")) q.note = t[base + ":note"];
      if (has(base + ":cost")) q.cost = t[base + ":cost"];
      if (has(base + ":time")) q._time = t[base + ":time"];
      const item = applyRef(q, t, slug, items, "title");
      if (item) {
        q.title = item.en;
        q.name = item.en;
        q.note = item.note ?? "";
        q.cost = "";
        q.picks = [];
        q._name = item.en;
      } else {
        q.picks = p.picks.map((it: Pick, i: number) => {
          const r: Pick = { ...it };
          r._name = it.name;
          const f = "pick:" + slug + ":" + i;
          if (has(f + ":name")) r.name = t[f + ":name"];
          if (has(f + ":cost")) r.cost = t[f + ":cost"];
          if (has(f + ":dim")) r.dim = t[f + ":dim"];
          return r;
        });
      }
    } else {
      const slug = stopSlug(p.name || "");
      q._slug = slug;
      q._name = p.name;
      const base = "stop:" + slug;
      if (has(base + ":name")) q.name = t[base + ":name"];
      if (has(base + ":cost")) q.cost = t[base + ":cost"];
      if (has(base + ":time")) q._time = t[base + ":time"];
      applyRef(q, t, slug, items, "name");
    }
    return q;
  });

  const seen = new Set<string>();
  for (const p of out.places) {
    if (p._slug) seen.add(p._slug);
  }
  for (const added of parseAddedStops(t.add)) {
    if (seen.has(added.s)) continue;
    seen.add(added.s);
    out.places.push(addedStopToStop(added));
  }

  const order = t.order;
  if (order) {
    const wanted = order.split(",");
    const rest = out.places.slice();
    const picked: Stop[] = [];
    for (const slug of wanted) {
      const idx = rest.findIndex((x) => x._slug === slug);
      if (idx !== -1) picked.push(rest.splice(idx, 1)[0]);
    }
    out.places = picked.concat(rest);
  }

  if (has("hide")) {
    const hiddenSlugs = t.hide.split(",").filter((slug) => slug.length > 0);
    const hidden: Stop[] = [];
    out.places = out.places.filter((p) => {
      if (p._slug && hiddenSlugs.indexOf(p._slug) !== -1) {
        hidden.push(p);
        return false;
      }
      return true;
    });
    out._hidden = hidden;
  }
  return out;
}

/** Поля правки для обычной остановки / группы вариантов / варианта в карусели. */
export function stopFieldSet(slug: string, pickIndex?: number) {
  if (pickIndex === undefined) {
    return {
      name: `stop:${slug}:name`,
      cost: `stop:${slug}:cost`,
      time: `stop:${slug}:time`,
      ref: `ref:${slug}`,
    };
  }
  return {
    name: `pick:${slug}:${pickIndex}:name`,
    cost: `pick:${slug}:${pickIndex}:cost`,
    dim: `pick:${slug}:${pickIndex}:dim`,
  };
}

export function groupFieldSet(slug: string) {
  return {
    title: `picks:${slug}:title`,
    note: `picks:${slug}:note`,
    cost: `picks:${slug}:cost`,
    time: `picks:${slug}:time`,
    ref: `ref:${slug}`,
  };
}

/** Ключ остановки в D1: «<вариант>|<ДД.ММ>|<slug>». */
export function stopKey(dayKey: string, name: string): string {
  return dayKey + "|" + stopSlug(name);
}

/** Перестановка остановки в порядке дня (порядок хранится списком slug'ов). */
export function moveInOrder(order: string[], slug: string, dir: "up" | "down"): string[] {
  const i = order.indexOf(slug);
  if (i === -1) return order;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= order.length) return order;
  const next = order.slice();
  const tmp = next[i];
  next[i] = next[j];
  next[j] = tmp;
  return next;
}
