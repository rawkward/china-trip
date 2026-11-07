import { describe, expect, it } from "vitest";
import {
  groupGuideByCity,
  guideDefaultTag,
  guideIdFor,
  guideItemByKey,
  GUIDE_TAG_KEY_RE,
  guideTagKey,
  isPark,
  refKindForTag,
  tagOf,
} from "./guide";
import type { GuideItem } from "../types";

const items: GuideItem[] = [
  { kind: "sight", city: "hk", id: "peak", en: "Victoria Peak", note: "трамвай", match: ["Пик", "Peak"] },
  { kind: "sight", city: "hk", id: "mplus", en: "M+", note: "таймслот", rec: true },
  { kind: "sight", city: "hk", id: "choihung", en: "Choi Hung Estate", note: "двор", badge: "альтернатива" },
  { kind: "sight", city: "cq", id: "hongyadong", en: "Hongyadong", note: "ночь" },
  { kind: "food", city: "cq", id: "hotpot", en: "Qin Ma Hotpot", note: "очередь" },
];

describe("guideTagKey и теги", () => {
  it("ключ — вид|город|id и проходит регулярку Worker'а", () => {
    const key = guideTagKey(items[0]);
    expect(key).toBe("sight|hk|peak");
    expect(GUIDE_TAG_KEY_RE.test(key)).toBe(true);
    expect(GUIDE_TAG_KEY_RE.test("sight|hk|")).toBe(false);
  });

  it("по умолчанию rec / alt по бейджу / choice", () => {
    expect(guideDefaultTag(items[1])).toBe("rec");
    expect(guideDefaultTag(items[2])).toBe("alt");
    expect(guideDefaultTag(items[0])).toBe("choice");
  });

  it("сохранённый тег перекрывает умолчание", () => {
    const tags = { "sight|hk|peak": "alt" as const };
    expect(tagOf(items[0], tags)).toBe("alt");
    expect(tagOf(items[0], {})).toBe("choice");
  });
});

describe("guideIdFor", () => {
  it("находит карточку по подстроке названия", () => {
    const withMatch: GuideItem[] = [{ ...items[0], match: ["Пик", "Peak"] }];
    expect(guideIdFor(withMatch, "Трамвай на Пик")).toBe("peak");
    expect(guideIdFor(withMatch, "Victoria Peak Tram")).toBe("peak");
  });

  it("возвращает пустую строку, если совпадений нет", () => {
    expect(guideIdFor(items, "Что-то своё")).toBe("");
    expect(guideIdFor(items, "")).toBe("");
    expect(guideIdFor(items, undefined)).toBe("");
  });
});

describe("guideItemByKey", () => {
  it("находит по ключу вида sight|cq|hongyadong", () => {
    expect(guideItemByKey(items, "sight|cq|hongyadong")?.en).toBe("Hongyadong");
  });

  it("null на промахе", () => {
    expect(guideItemByKey(items, "sight|nope|x")).toBeNull();
  });
});

describe("refKindForTag", () => {
  it("маппит тег остановки в вид справочника", () => {
    expect(refKindForTag("food")).toBe("food");
    expect(refKindForTag("hotel")).toBe("stay");
    expect(refKindForTag("sight")).toBe("sight");
    expect(refKindForTag(undefined)).toBe("sight");
    expect(refKindForTag("shopping")).toBe("sight");
  });
});

describe("groupGuideByCity", () => {
  const cityLabels = { hk: { label: "Гонконг" }, cq: { label: "Чунцин" } };
  const cityOrder = ["hk", "cq"];

  it("группирует по городам в порядке cityOrder", () => {
    const groups = groupGuideByCity(items, cityOrder, cityLabels, "sight", {});
    expect(groups.map((g) => g.city)).toEqual(["hk", "cq"]);
    expect(groups[0].label).toBe("Гонконг");
    expect(groups[0].total).toBe(3);
  });

  it("главные карточки идут перед альтернативами, рекомендация — первой", () => {
    const groups = groupGuideByCity(items, cityOrder, cityLabels, "sight", {});
    expect(groups[0].main.map((i) => i.id)).toEqual(["mplus", "peak"]);
    expect(groups[0].alts.map((i) => i.id)).toEqual(["choihung"]);
  });

  it("сохранённый тег меняет раскладку", () => {
    const groups = groupGuideByCity(items, cityOrder, cityLabels, "sight", { "sight|hk|peak": "alt" });
    expect(groups[0].main.map((i) => i.id)).toEqual(["mplus"]);
    expect(groups[0].alts.map((i) => i.id)).toEqual(["peak", "choihung"]);
  });

  it("чужой вид карточек не попадает в группу", () => {
    const groups = groupGuideByCity(items, cityOrder, cityLabels, "food", {});
    expect(groups.map((g) => g.city)).toEqual(["cq"]);
    expect(groups[0].total).toBe(1);
  });

  it("фильтр парков оставляет только карточки с флагом park", () => {
    const mixed: GuideItem[] = [...items, { ...items[0], park: true }];
    const all = groupGuideByCity(mixed, cityOrder, cityLabels, "sight", {});
    const parks = groupGuideByCity(mixed, cityOrder, cityLabels, "sight", {}, isPark);

    expect(all.reduce((n, g) => n + g.total, 0)).toBe(5);
    expect(parks.map((g) => g.city)).toEqual(["hk"]);
    expect(parks[0].total).toBe(1);
    expect(parks[0].main[0].park).toBe(true);
  });

  it("город без города в cityOrder уходит в конец с сырым ключом", () => {
    const extra: GuideItem[] = [{ kind: "sight", city: "sh", id: "bund", en: "The Bund" }];
    const groups = groupGuideByCity([...items, ...extra], cityOrder, cityLabels, "sight", {});
    expect(groups.map((g) => g.city)).toEqual(["hk", "cq", "sh"]);
    expect(groups[2].label).toBe("sh");
  });
});
