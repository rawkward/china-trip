import type { DayTag, GuideItem, GuideKind, GuideTagValue } from "../types";

export const GUIDE_TAG_LABELS: Record<GuideTagValue, string> = {
  rec: "рекомендация",
  choice: "выбор",
  alt: "альтернатива",
};

/** Регулярка ключа тега — та же, что валидирует Worker. */
export const GUIDE_TAG_KEY_RE = /^[a-z]{4,6}\|[a-z0-9_-]{1,20}\|[a-z0-9][a-z0-9_-]{0,39}$/;

export function guideTagKey(it: Pick<GuideItem, "kind" | "city" | "id">): string {
  return it.kind + "|" + it.city + "|" + it.id;
}

export function guideDefaultTag(it: GuideItem): GuideTagValue {
  if (it.rec) return "rec";
  if (it.badge === "альтернатива") return "alt";
  return "choice";
}

export function tagOf(it: GuideItem, tags: Record<string, GuideTagValue>): GuideTagValue {
  return tags[guideTagKey(it)] ?? guideDefaultTag(it);
}

/** id карточки справочника, в название которой попадает имя остановки. */
export function guideIdFor(items: GuideItem[], name: string | undefined): string {
  if (!name) return "";
  for (const it of items) {
    for (const m of it.match ?? []) {
      if (name.indexOf(m) !== -1) return it.id;
    }
  }
  return "";
}

export function guideItemByKey(items: GuideItem[], key: string): GuideItem | null {
  return items.find((it) => guideTagKey(it) === key) ?? null;
}

/** Критерий фильтра справочника, в который попадает остановка дня. */
export function guideTagMatches(name: string | undefined, match: string[] | undefined): boolean {
  if (!name) return false;
  return (match ?? []).some((m) => name.indexOf(m) !== -1);
}

/** Подстановка справочника по тегу остановки: еда → food, отель → stay, иначе sight. */
export function refKindForTag(tag: DayTag | undefined): GuideKind {
  if (tag === "food") return "food";
  if (tag === "hotel") return "stay";
  return "sight";
}

export interface GuideCityGroup {
  city: string;
  label: string;
  main: GuideItem[];
  alts: GuideItem[];
  total: number;
}

const TAG_ORDER: Record<GuideTagValue, number> = { rec: 0, choice: 1, alt: 2 };

/** Карточки одного вида, разложенные по городам и отсортированные по тегу. */
export function groupGuideByCity(
  items: GuideItem[],
  cityOrder: string[],
  cityLabels: Record<string, { label: string }>,
  kind: GuideKind,
  tags: Record<string, GuideTagValue>,
): GuideCityGroup[] {
  const ofKind = items.filter((i) => i.kind === kind);
  const cities: string[] = [];
  for (const i of ofKind) if (cities.indexOf(i.city) === -1) cities.push(i.city);
  cities.sort((a, b) => cityOrder.indexOf(a) - cityOrder.indexOf(b));
  return cities.map((city) => {
    const group = ofKind
      .filter((i) => i.city === city)
      .slice()
      .sort((a, b) => TAG_ORDER[tagOf(a, tags)] - TAG_ORDER[tagOf(b, tags)]);
    return {
      city,
      label: cityLabels[city]?.label ?? city,
      main: group.filter((i) => tagOf(i, tags) !== "alt"),
      alts: group.filter((i) => tagOf(i, tags) === "alt"),
      total: group.length,
    };
  });
}
