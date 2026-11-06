import { describe, expect, it } from "vitest";
import cbr from "./fixtures/cbr-daily.json";
import { ApiError } from "../../api/client";
import { buildItemPayload, blankDraft, draftFromItem, DraftError } from "./drafts";
import { errorText } from "./errors";
import { readCbrDate, readCbrRate, rateDiffers } from "./fx";
import { cityLabel, cityPrefixError, itemWord } from "./labels";
import { formatClock, parseNumberInput } from "./numbers";
import type { BudgetItem } from "./types";

describe("parseNumberInput", () => {
  it("понимает русскую запись с пробелом и запятой", () => {
    expect(parseNumberInput("1 200,50")).toBe(1200.5);
    expect(parseNumberInput("1\u00a0200,5")).toBe(1200.5);
    expect(parseNumberInput("12,25")).toBe(12.25);
    expect(parseNumberInput("1200.5")).toBe(1200.5);
  });

  it("пустая строка и мусор дают null", () => {
    expect(parseNumberInput("")).toBeNull();
    expect(parseNumberInput("   ")).toBeNull();
    expect(parseNumberInput(null)).toBeNull();
    expect(parseNumberInput(undefined)).toBeNull();
    expect(parseNumberInput("мусор")).toBeNull();
    expect(parseNumberInput("1.2.3")).toBeNull();
  });
});

describe("строительство статьи", () => {
  it("blankDraft и draftFromItem переносят режим формулы", () => {
    const draft = blankDraft("cat_1");
    expect(draft).toMatchObject({ id: null, category_id: "cat_1", currency: "CNY", qtyMode: "number" });

    const item: BudgetItem = {
      id: "itm_1",
      category_id: "cat_1",
      name: "Отель",
      qty: null,
      qty_formula: "people*nights",
      unit_price: 450,
      price_formula: null,
      currency: "CNY",
      note: "заметка",
      sort: 0,
    };
    const restored = draftFromItem(item);
    expect(restored.qtyMode).toBe("formula");
    expect(restored.priceMode).toBe("number");
    expect(restored.qty_formula).toBe("people*nights");
    expect(restored.unit_price).toBe("450");
  });

  it("собирает payload числа с русским разделителем", () => {
    const draft = { ...blankDraft("cat_1"), name: "  Такси  ", qty: "2", unit_price: "1 200,50" };
    const payload = buildItemPayload(draft);
    expect(payload).toEqual({
      category_id: "cat_1",
      name: "Такси",
      currency: "CNY",
      note: "",
      qty: 2,
      unit_price: 1200.5,
    });
    expect(payload.qty_formula).toBeUndefined();
    expect(payload.price_formula).toBeUndefined();
  });

  it("в режиме формулы отправляет формулу вместо числа", () => {
    const draft = {
      ...blankDraft("cat_1"),
      name: "Отель",
      qtyMode: "formula" as const,
      qty_formula: " people*hk_nights ",
      unit_price: "0",
    };
    const payload = buildItemPayload(draft);
    expect(payload.qty_formula).toBe("people*hk_nights");
    expect(payload.qty).toBeUndefined();
    expect(payload.unit_price).toBe(0);
  });

  it("обязательные поля: название, категория, валюта", () => {
    expect(() => buildItemPayload({ ...blankDraft("cat_1"), name: "   " })).toThrowError(
      /Укажите название/,
    );
    expect(() => buildItemPayload({ ...blankDraft("cat_1"), name: "x", category_id: "" })).toThrowError(
      /Выберите категорию/,
    );
    expect(() =>
      buildItemPayload({
        ...blankDraft("cat_1"),
        name: "x",
        currency: "USD" as unknown as "CNY",
      }),
    ).toThrowError(/Выберите валюту/);
  });

  it("пустая формула и отрицательное количество — ошибки с полем", () => {
    const draft = { ...blankDraft("cat_1"), name: "x", qtyMode: "formula" as const, qty_formula: " " };
    try {
      buildItemPayload(draft);
      throw new Error("ожидали ошибку");
    } catch (err) {
      expect(err).toBeInstanceOf(DraftError);
      expect((err as DraftError).field).toBe("qty_formula");
    }

    expect(() =>
      buildItemPayload({ ...blankDraft("cat_1"), name: "x", qty: "-1" }),
    ).toThrowError(/Количество должно быть числом/);
    expect(() =>
      buildItemPayload({ ...blankDraft("cat_1"), name: "x", unit_price: "мусор" }),
    ).toThrowError(/Цена должна быть числом/);
  });
});

describe("курс ЦБ", () => {
  it("делит Value на Nominal из фикстуры daily_json", () => {
    expect(readCbrRate(cbr, "CNY")).toBeCloseTo(12.0873, 6);
    expect(readCbrRate(cbr, "HKD")).toBeCloseTo(10.266, 6);
    expect(readCbrRate(cbr, "USD")).toBeNull();
    expect(readCbrRate(null, "CNY")).toBeNull();
    expect(readCbrRate({ Valute: { CNY: { Value: 10, Nominal: 0 } } }, "CNY")).toBeNull();
    expect(readCbrDate(cbr)).toBe("2026-10-31T11:30:00+03:00");
  });

  it("предлагает курс только при отличии больше 0,1 %", () => {
    expect(rateDiffers(12, 12.01)).toBe(false);
    expect(rateDiffers(12, 12.02)).toBe(true);
    expect(rateDiffers(0, 0)).toBe(false);
    expect(rateDiffers(0, 1)).toBe(true);
    expect(rateDiffers(undefined, 12)).toBe(false);
    expect(rateDiffers(12, Number.NaN)).toBe(false);
  });
});

describe("мелочи", () => {
  it("formatClock: HH:MM", () => {
    expect(formatClock(new Date(2026, 0, 1, 9, 5).getTime())).toBe("09:05");
    expect(formatClock(Number.NaN)).toBe("—");
  });

  it("подписи и склонения", () => {
    expect(cityLabel("cq")).toBe("Чунцин");
    expect(cityLabel("new_city")).toBe("New city");
    expect(itemWord(1)).toBe("статья");
    expect(itemWord(3)).toBe("статьи");
    expect(itemWord(11)).toBe("статей");
    expect(itemWord(21)).toBe("статья");
  });

  it("валидация кода города", () => {
    expect(cityPrefixError("sh", ["cq"])).toBeNull();
    expect(cityPrefixError("", [])).toBe("Укажите код города");
    expect(cityPrefixError("шанхай", [])).toMatch(/Латиница/);
    expect(cityPrefixError("cq", ["cq"])).toBe("Такой город уже есть");
  });

  it("errorText переводит коды сервера", () => {
    expect(errorText(new ApiError(429, "too_many_attempts"))).toMatch(/слишком много/i);
    expect(errorText(new ApiError(401, "unauthorized"))).toMatch(/сессия истекла/i);
    expect(errorText(new ApiError(403, "wrong_password"))).toBe("неверный пароль");
    expect(errorText(new ApiError(0, "нет связи с сервером"))).toBe("нет связи с сервером");
    expect(errorText(new Error("boom"))).toBe("boom");
  });
});
