import { describe, expect, it } from "vitest";
import {
  addedStopToStop,
  parseAddedStops,
  serializeAddedStops,
  tagForGuideKind,
} from "./added-stops";

describe("parseAddedStops", () => {
  it("разбирает валидный список и обрезает поля", () => {
    const raw = JSON.stringify([
      {
        s: "a1b2c3",
        n: "  Музей  ",
        t: "sight",
        c: " ¥50 ",
        d: " заметка ",
        g: " mplus ",
      },
    ]);
    expect(parseAddedStops(raw)).toEqual([
      { s: "a1b2c3", n: "Музей", t: "sight", c: "¥50", d: "заметка", g: "mplus" },
    ]);
  });

  it("терпим к мусору и невалидным элементам", () => {
    expect(parseAddedStops("не json")).toEqual([]);
    expect(parseAddedStops("")).toEqual([]);
    expect(parseAddedStops(undefined)).toEqual([]);
    expect(parseAddedStops('{"s":"a1b2c3"}')).toEqual([]);
    const raw = JSON.stringify([
      null,
      42,
      { s: "bad", n: "Плохой slug" },
      { s: "a1b2c3", n: "   " },
      { s: "d4e5f6", n: "  Годная  ", t: "party" },
    ]);
    expect(parseAddedStops(raw)).toEqual([{ s: "d4e5f6", n: "Годная" }]);
  });

  it("не берёт больше восьми элементов и обрезает длинные поля", () => {
    const list = Array.from({ length: 10 }, (_, i) => ({
      s: "s" + String(i).padStart(5, "0"),
      n: "Имя " + i,
      d: "я".repeat(400),
    }));
    const parsed = parseAddedStops(JSON.stringify(list));
    expect(parsed).toHaveLength(8);
    expect(parsed[0].d).toHaveLength(300);
  });
});

describe("serializeAddedStops", () => {
  it("пишет компактный JSON и сбрасывает пустой список в строку", () => {
    const list = [{ s: "a1b2c3", n: "Музей", t: "sight" as const }];
    expect(serializeAddedStops(list)).toBe('[{"s":"a1b2c3","n":"Музей","t":"sight"}]');
    expect(serializeAddedStops([])).toBe("");
  });
});

describe("addedStopToStop", () => {
  it("превращает добавленную остановку в Stop с производными полями", () => {
    expect(addedStopToStop({ s: "a1b2c3", n: "Музей", t: "food", c: "¥50", d: "заметка", g: "mplus" })).toEqual({
      k: "",
      name: "Музей",
      tag: "food",
      cost: "¥50",
      note: "заметка",
      _slug: "a1b2c3",
      _name: "Музей",
      _guide: "mplus",
      _added: true,
    });
  });

  it("по умолчанию ставит тег sight", () => {
    expect(addedStopToStop({ s: "a1b2c3", n: "Место" }).tag).toBe("sight");
  });
});

describe("tagForGuideKind", () => {
  it("еда — food, отель — hotel, остальное — sight", () => {
    expect(tagForGuideKind("food")).toBe("food");
    expect(tagForGuideKind("stay")).toBe("hotel");
    expect(tagForGuideKind("sight")).toBe("sight");
    expect(tagForGuideKind("tip")).toBe("sight");
  });
});
