import { describe, expect, it } from "vitest";
import { buildDays, dayByNum, nightsWord, noteKey, routeGroups, variantDateRange } from "./days";
import type { Day, DayBlock, Variant } from "../types";

const block = (city: string, title = "День"): DayBlock => ({
  city,
  title,
  sub: "подзаголовок",
  places: [],
});

const variant = (over: Partial<Variant> = {}): Variant => ({
  id: "hk-first",
  title: "Гонконг → Чунцин",
  photo: "Hong Kong",
  china: [block("hk"), block("hk"), block("cq")],
  hk: [],
  cities: [],
  summary: "",
  pros: [],
  cons: [],
  budget: "",
  ...over,
});

const DATES = ["01.12 · пн", "02.12 · вт", "03.12 · ср", "04.12 · чт"];

describe("buildDays", () => {
  it("нумерует дни и берёт даты из общей оси", () => {
    const days = buildDays(variant(), DATES);
    expect(days.map((d) => d.n)).toEqual([1, 2, 3]);
    expect(days.map((d) => d.date)).toEqual(["01.12 · пн", "02.12 · вт", "03.12 · ср"]);
    expect(days[0].city).toBe("hk");
  });

  it("предпочитает собственную ось варианта", () => {
    const own = ["04.12 · пт", "05.12 · сб", "06.12 · вс"];
    const days = buildDays(variant({ dates: own }), DATES);
    expect(days[0].date).toBe("04.12 · пт");
    expect(days[2].date).toBe("06.12 · вс");
  });

  it("склеивает china и hk, пустая ось дня не ломает номер", () => {
    const days = buildDays(variant({ china: [block("hk")], hk: [block("mc")] }), ["01.12 · пн"]);
    expect(days).toHaveLength(2);
    expect(days[1]).toMatchObject({ n: 2, city: "mc", date: "" });
  });

  it("без варианта возвращает пустой список", () => {
    expect(buildDays(undefined, DATES)).toEqual([]);
  });
});

describe("nightsWord", () => {
  it("склоняет по-русски", () => {
    expect(nightsWord(1)).toBe("ночь");
    expect(nightsWord(2)).toBe("ночи");
    expect(nightsWord(4)).toBe("ночи");
    expect(nightsWord(5)).toBe("ночей");
    expect(nightsWord(11)).toBe("ночей");
    expect(nightsWord(12)).toBe("ночей");
    expect(nightsWord(14)).toBe("ночей");
    expect(nightsWord(21)).toBe("ночь");
    expect(nightsWord(22)).toBe("ночи");
    expect(nightsWord(0)).toBe("ночей");
  });
});

describe("routeGroups", () => {
  const days = [
    { city: "hk" },
    { city: "hk" },
    { city: "cq" },
    { city: "cq" },
    { city: "cq" },
  ] as Day[];

  it("считает ночи подряд идущими городами, последний отрезок теряет одну", () => {
    const { groups, total } = routeGroups(days);
    expect(groups).toEqual([
      { city: "hk", nights: 2, isLast: false },
      { city: "cq", nights: 2, isLast: true },
    ]);
    expect(total).toBe(4);
  });

  it("последний отрезок в один день даёт ноль ночей", () => {
    const { groups } = routeGroups([{ city: "hk" }, { city: "sh" }] as Day[]);
    expect(groups[1]).toMatchObject({ nights: 0, isLast: true });
  });

  it("пустой маршрут", () => {
    expect(routeGroups([])).toEqual({ groups: [], total: 0 });
  });
});

describe("noteKey", () => {
  it("берёт ДД.ММ из даты дня", () => {
    expect(noteKey("hk-first", { date: "07.12 · пн", n: 4 })).toBe("hk-first|07.12");
  });

  it("без даты падает на номер дня", () => {
    expect(noteKey("hk-first", { date: "", n: 9 })).toBe("hk-first|д9");
  });
});

describe("variantDateRange", () => {
  it("режет первую и последнюю дату до ДД.ММ", () => {
    expect(variantDateRange(variant(), DATES)).toBe("01.12–03.12");
  });

  it("учитывает собственную ось и короткий вариант", () => {
    const own = ["04.12 · пт", "05.12 · сб", "06.12 · вс", "07.12 · пн"];
    expect(variantDateRange(variant({ dates: own }), DATES)).toBe("04.12–06.12");
  });

  it("пустая ось — пустая строка", () => {
    expect(variantDateRange(variant({ china: [], hk: [] }), [])).toBe("");
  });
});

describe("dayByNum", () => {
  it("находит день и возвращает null на промахе", () => {
    const days = buildDays(variant(), DATES);
    expect(dayByNum(days, 2)?.n).toBe(2);
    expect(dayByNum(days, 42)).toBeNull();
  });
});
