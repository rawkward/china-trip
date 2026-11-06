import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiError } from "../../api/client";
import { readBudgetCache, writeBudgetCache, BUDGET_CACHE_KEY } from "./cache";
import { blankDraft, buildItemPayload, draftFromItem } from "./drafts";
import { errorText, isUnauthorized } from "./errors";
import {
  compareSort,
  displayNumber,
  formatDateIso,
  formatDateSeconds,
  formatRate,
} from "./numbers";
import type { BudgetData, BudgetItem } from "./types";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("кэш бюджета", () => {
  const data: BudgetData = {
    params: { people: 2, cny_rate: 11 },
    params_updated_at: 1,
    categories: [],
    items: [],
    version: 1,
  };

  it("пишет и читает последний успешный ответ", () => {
    writeBudgetCache(data);
    const cached = readBudgetCache();
    expect(cached?.data).toEqual(data);
    expect(cached?.at).toBeGreaterThan(0);
  });

  it("игнорирует мусор и неполные документы", () => {
    localStorage.setItem(BUDGET_CACHE_KEY, "не json");
    expect(readBudgetCache()).toBeNull();

    localStorage.setItem(BUDGET_CACHE_KEY, JSON.stringify({ at: 1 }));
    expect(readBudgetCache()).toBeNull();

    localStorage.setItem(
      BUDGET_CACHE_KEY,
      JSON.stringify({ at: 1, data: { params: {}, items: [] } }),
    );
    expect(readBudgetCache()).toBeNull();

    localStorage.setItem(
      BUDGET_CACHE_KEY,
      JSON.stringify({ at: "вчера", data: { params: {}, categories: [], items: [] } }),
    );
    expect(readBudgetCache()?.at).toBeGreaterThan(0);
  });
});

describe("числовые помощники", () => {
  it("displayNumber показывает пустое для не-числа и убирает хвост", () => {
    expect(displayNumber(undefined)).toBe("");
    expect(displayNumber(Number.NaN)).toBe("");
    expect(displayNumber(0.1)).toBe("0.1");
    expect(displayNumber(0.1234, 100)).toBe("12.34");
    expect(displayNumber(10, 100)).toBe("1000");
  });

  it("compareSort сравнивает sort, затем id", () => {
    const a = { id: "b", sort: 1 };
    const b = { id: "a", sort: 1 };
    const c = { id: "c", sort: 0 };
    const noSort = { id: "d" } as { id: string; sort?: number };
    expect(compareSort(c, a)).toBeLessThan(0);
    expect(compareSort(a, b)).toBeGreaterThan(0);
    expect(compareSort(noSort, c)).toBeGreaterThan(0);
  });

  it("formatRate, formatDateSeconds и formatDateIso не падают на мусоре", () => {
    expect(formatRate(Number.NaN)).toBe("—");
    expect(formatRate(12.1)).toMatch(/12,1000/);
    expect(formatDateSeconds(null)).toBe("—");
    expect(formatDateSeconds(Number.NaN)).toBe("—");
    expect(formatDateSeconds(1_700_000_000)).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    expect(formatDateIso("")).toBe("");
    expect(formatDateIso("не дата")).toBe("");
    expect(formatDateIso("2026-10-31")).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });
});

describe("errorText и isUnauthorized", () => {
  it("переводит коды сервера и не теряет незнакомый текст", () => {
    expect(errorText(new ApiError(0, ""))).toMatch(/сервер недоступен/);
    expect(errorText(new ApiError(401, "unauthorized"))).toMatch(/сессия истекла/);
    expect(errorText(new ApiError(403, "wrong_password"))).toBe("неверный пароль");
    expect(errorText(new ApiError(429, "too_many_attempts"))).toMatch(/слишком много/);
    expect(errorText(new ApiError(400, "bad_json"))).toBe("некорректный запрос");
    expect(errorText(new ApiError(400, "body_too_large"))).toBe("слишком большой запрос");
    expect(errorText(new ApiError(500, "server_misconfigured"))).toBe("сервер не настроен");
    expect(errorText(new ApiError(500, ""))).toBe("ошибка сервера (500)");
    expect(errorText(new ApiError(418, "неизвестно"))).toBe("неизвестно");
    expect(errorText({})).toBe("неизвестная ошибка");
  });

  it("isUnauthorized срабатывает только на 401", () => {
    expect(isUnauthorized(new ApiError(401, "x"))).toBe(true);
    expect(isUnauthorized(new ApiError(403, "x"))).toBe(false);
    expect(isUnauthorized(new Error("401"))).toBe(false);
  });
});

describe("черновик статьи: границы", () => {
  const item: BudgetItem = {
    id: "itm_1",
    category_id: "cat_1",
    name: "",
    qty: null,
    qty_formula: null,
    unit_price: null,
    price_formula: null,
    currency: "HKD",
    note: "",
    sort: 0,
  };

  it("draftFromItem терпит пустые значения и незнакомую валюту", () => {
    const draft = draftFromItem(item);
    expect(draft).toMatchObject({
      id: "itm_1",
      name: "",
      qty: "",
      unit_price: "",
      currency: "HKD",
      qtyMode: "number",
      priceMode: "number",
    });

    const bad = draftFromItem({ ...item, currency: "USD" as unknown as BudgetItem["currency"] });
    expect(bad.currency).toBe("CNY");
  });

  it("слишком длинные название и комментарий отклоняются с полем", () => {
    expect(() =>
      buildItemPayload({ ...blankDraft("cat_1"), name: "x".repeat(121) }),
    ).toThrowError(/Название длиннее/);
    expect(() =>
      buildItemPayload({ ...blankDraft("cat_1"), name: "x", note: "x".repeat(501) }),
    ).toThrowError(/Комментарий длиннее/);
  });
});
